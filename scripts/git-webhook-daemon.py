#!/usr/bin/env python3
"""
git-webhook-daemon.py — Portable Multi-Repository Webhook & Worktree Cleanup Daemon.

Listens for GitHub webhook events forwarded via `gh webhook forward`
(specifically `pull_request.closed` where `merged == True`).
Automatically maps GitHub repositories to their local filesystem paths on this machine,
safely removes linked ephemeral git worktrees, deletes merged local branches,
and executes cold-boot reconciliation on startup or on a scheduled weekly timer.
"""

import argparse
import http.server
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("git-webhook-daemon")

CONFIG_DIR = Path.home() / ".config" / "git-webhook-daemon"
REGISTRY_FILE = CONFIG_DIR / "repos.json"


def get_registry_file() -> Path:
    """Ensure config directory exists and return registry file path."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    return REGISTRY_FILE


def load_registry() -> Dict[str, str]:
    """Load repo mapping registry: identifier -> local directory."""
    reg_file = get_registry_file()
    if not reg_file.is_file():
        return {}
    try:
        data = json.loads(reg_file.read_text(encoding="utf-8"))
        return data.get("repositories", {})
    except Exception as exc:
        logger.warning("Failed to parse registry file %s: %s", reg_file, exc)
        return {}


def save_registry(repos: Dict[str, str]) -> None:
    """Save repo mapping registry to disk."""
    reg_file = get_registry_file()
    payload = {"version": 1, "repositories": repos}
    reg_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_cmd(cmd: List[str], cwd: Optional[str] = None) -> Tuple[int, str, str]:
    """Run a shell command and return (returncode, stdout, stderr)."""
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except Exception as exc:
        return 1, "", str(exc)


def extract_repo_slugs_from_git(repo_dir: str) -> Set[str]:
    """Extract all potential repository identifiers (slugs, names) from git remotes."""
    slugs: Set[str] = set()
    code, out, _ = run_cmd(["git", "remote", "-v"], cwd=repo_dir)
    if code == 0 and out:
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 2:
                url = parts[1]
                # Match git@github.com:owner/repo.git or https://github.com/owner/repo.git
                match = re.search(r"github\.com[:/]([^/]+)/([^/\.]+)(?:\.git)?", url)
                if match:
                    owner, repo = match.group(1), match.group(2)
                    slugs.add(f"{owner}/{repo}".lower())
                    slugs.add(repo.lower())
    # Also add the directory basename
    slugs.add(os.path.basename(os.path.abspath(repo_dir)).lower())
    return slugs


def register_repo(path_str: str) -> None:
    """Register a local repository into the machine registry."""
    abs_path = os.path.abspath(path_str)
    code, out, _ = run_cmd(["git", "rev-parse", "--show-toplevel"], cwd=abs_path)
    if code != 0 or not out:
        logger.error("Path '%s' is not inside a valid Git repository.", abs_path)
        return

    repo_dir = os.path.abspath(out)
    slugs = extract_repo_slugs_from_git(repo_dir)
    registry = load_registry()

    for slug in slugs:
        registry[slug] = repo_dir

    save_registry(registry)
    logger.info("Successfully registered repository '%s' under slugs: %s", repo_dir, list(slugs))


def find_local_repo_for_event(event_data: dict, fallback_dir: Optional[str] = None) -> Optional[str]:
    """Map incoming GitHub webhook event to a local repository directory on this machine."""
    repo_info = event_data.get("repository", {})
    full_name = repo_info.get("full_name", "").lower()
    name = repo_info.get("name", "").lower()

    registry = load_registry()

    for key in (full_name, name):
        if key and key in registry:
            path = registry[key]
            if os.path.isdir(path):
                return path

    # Fallback to single configured directory if provided
    if fallback_dir and os.path.isdir(fallback_dir):
        return fallback_dir

    return None


def send_notification(title: str, message: str) -> None:
    """Send a desktop notification via notify-send if available."""
    if shutil.which("notify-send"):
        try:
            subprocess.run(["notify-send", title, message], check=False)
        except Exception:
            pass


def get_active_worktrees(repo_dir: str) -> List[Dict[str, str]]:
    """Parse git worktree list --porcelain into a structured list."""
    code, out, _ = run_cmd(["git", "worktree", "list", "--porcelain"], cwd=repo_dir)
    if code != 0 or not out:
        return []

    worktrees: List[Dict[str, str]] = []
    current: Dict[str, str] = {}

    for line in out.splitlines():
        line = line.strip()
        if not line:
            if current:
                worktrees.append(current)
                current = {}
            continue
        if line.startswith("worktree "):
            current["path"] = line.split(" ", 1)[1]
        elif line.startswith("branch "):
            ref = line.split(" ", 1)[1]
            if ref.startswith("refs/heads/"):
                current["branch"] = ref[len("refs/heads/"):]
            else:
                current["branch"] = ref
        elif line == "bare":
            current["bare"] = "true"

    if current:
        worktrees.append(current)

    return worktrees


def is_worktree_dirty(wt_path: str) -> bool:
    """Check if a worktree has uncommitted or untracked changes."""
    if not os.path.exists(wt_path):
        return False
    code, out, _ = run_cmd(["git", "status", "--porcelain"], cwd=wt_path)
    if code != 0:
        return True
    lines = [
        line for line in out.splitlines()
        if line.strip() and not line.endswith(".wt-parent")
    ]
    return len(lines) > 0


def clean_worktree_and_branch(repo_dir: str, branch: str, dry_run: bool = False) -> bool:
    """
    Safely remove the worktree, delete the local branch, and delete the remote branch on GitHub.
    Guarantees that dirty worktrees/branches are NEVER pruned.
    """
    if branch in ("main", "master", "develop"):
        logger.warning("[%s] Branch '%s' is protected. Skipping deletion.", os.path.basename(repo_dir), branch)
        return False

    logger.info("[%s] Processing cleanup for closed/merged branch: %s", os.path.basename(repo_dir), branch)

    # 1. Check if the branch is currently checked out in the primary repo root
    code, current_branch, _ = run_cmd(["git", "branch", "--show-current"], cwd=repo_dir)
    if code == 0 and current_branch.strip() == branch:
        if is_worktree_dirty(repo_dir):
            logger.warning(
                "[SAFETY LOCK] Primary repo root at %s is on branch '%s' and has uncommitted changes! Refusing to auto-delete.",
                repo_dir,
                branch,
            )
            send_notification(
                "Branch Protected",
                f"Branch '{branch}' was closed, but repo root contains uncommitted changes. Kept on disk.",
            )
            return False

        default_branch = "main"
        code, d_out, _ = run_cmd(["git", "branch", "--list", "main", "master"], cwd=repo_dir)
        if "main" in d_out:
            default_branch = "main"
        elif "master" in d_out:
            default_branch = "master"

        logger.info("[%s] Primary repo root is currently on '%s'. Switching to '%s' before cleanup.", os.path.basename(repo_dir), branch, default_branch)
        if not dry_run:
            code, _, err = run_cmd(["git", "checkout", default_branch], cwd=repo_dir)
            if code != 0:
                logger.error("[%s] Failed to switch to %s: %s", os.path.basename(repo_dir), default_branch, err)
                return False

    # 2. Check if a dedicated worktree exists for this branch
    worktrees = get_active_worktrees(repo_dir)
    matching_wt: Optional[Dict[str, str]] = None
    for wt in worktrees:
        if wt.get("branch") == branch:
            matching_wt = wt
            break

    if matching_wt:
        wt_path = matching_wt.get("path", "")
        if os.path.abspath(wt_path) != os.path.abspath(repo_dir):
            if is_worktree_dirty(wt_path):
                logger.warning(
                    "[SAFETY LOCK] Worktree at %s has uncommitted changes! Refusing to auto-delete.",
                    wt_path,
                )
                send_notification(
                    "Worktree Protected",
                    f"Branch '{branch}' was closed, but '{wt_path}' contains uncommitted changes. Kept on disk.",
                )
                return False

            logger.info("[%s] Removing clean worktree at: %s", os.path.basename(repo_dir), wt_path)
            if not dry_run:
                code, _, err = run_cmd(["git", "worktree", "remove", wt_path, "--force"], cwd=repo_dir)
                if code != 0:
                    logger.error("Failed to remove worktree %s: %s", wt_path, err)
                    return False
                run_cmd(["git", "worktree", "prune"], cwd=repo_dir)
                logger.info("Successfully pruned worktree: %s", wt_path)

    # 3. Delete the local branch
    code, branches, _ = run_cmd(["git", "branch", "--list", branch], cwd=repo_dir)
    if code == 0 and branch in branches:
        logger.info("[%s] Deleting local branch: %s", os.path.basename(repo_dir), branch)
        if not dry_run:
            code, _, err = run_cmd(["git", "branch", "-D", branch], cwd=repo_dir)
            if code != 0:
                logger.error("Failed to delete local branch %s: %s", branch, err)
                return False
            logger.info("Successfully deleted local branch: %s", branch)

    # 4. Delete the remote branch on GitHub (if it still exists on origin)
    code, rem_heads, _ = run_cmd(["git", "ls-remote", "--heads", "origin", branch], cwd=repo_dir)
    if code == 0 and branch in rem_heads:
        logger.info("[%s] Deleting remote branch on GitHub: origin/%s", os.path.basename(repo_dir), branch)
        if not dry_run:
            code, _, err = run_cmd(["git", "push", "origin", "--delete", branch], cwd=repo_dir)
            if code == 0:
                logger.info("[%s] Successfully deleted remote branch on GitHub: %s", os.path.basename(repo_dir), branch)
            else:
                logger.warning("[%s] Could not delete remote branch %s on GitHub: %s", os.path.basename(repo_dir), branch, err)

    # 5. Prune remote tracking references
    if not dry_run:
        run_cmd(["git", "fetch", "--prune", "origin"], cwd=repo_dir)

    send_notification("PR Cleanup Complete", f"Worktree and branch '{branch}' successfully pruned locally and from GitHub.")
    return True


def reconcile_cold_boot(repo_dir: str, dry_run: bool = False) -> int:
    """
    Cold-Boot & Periodic Reconciliation:
    Queries GitHub CLI for recently merged or closed PRs and prunes active local worktrees and branches.
    """
    if not shutil.which("gh"):
        return 0

    code, out, err = run_cmd(
        ["gh", "pr", "list", "--state", "closed", "--limit", "50", "--json", "headRefName"],
        cwd=repo_dir,
    )
    if code != 0:
        return 0

    try:
        data = json.loads(out)
        closed_branches = {item["headRefName"] for item in data if "headRefName" in item}
    except Exception:
        return 0

    # Prune remote tracking first
    run_cmd(["git", "fetch", "--prune", "origin"], cwd=repo_dir)

    # Discover candidate branches: all local branches + active worktrees
    code, out, _ = run_cmd(["git", "for-each-ref", "--format=%(refname:short)", "refs/heads/"], cwd=repo_dir)
    local_branches = {b.strip() for b in out.splitlines() if b.strip()}

    worktrees = get_active_worktrees(repo_dir)
    wt_branches = {wt.get("branch") for wt in worktrees if wt.get("branch")}

    candidate_branches = (local_branches | wt_branches) & closed_branches
    candidate_branches -= {"main", "master", "develop", "HEAD"}

    pruned_count = 0
    for branch in candidate_branches:
        logger.info("[%s] Reconciliation: Found closed/merged PR for branch '%s'. Cleaning up...", os.path.basename(repo_dir), branch)
        if clean_worktree_and_branch(repo_dir, branch, dry_run=dry_run):
            pruned_count += 1

    return pruned_count


def reconcile_all_registered(dry_run: bool = False) -> int:
    """Run cold-boot reconciliation across all registered repositories on this machine."""
    registry = load_registry()
    unique_dirs = set(registry.values())
    total_pruned = 0

    logger.info("Running reconciliation across %d registered repository directory/ies...", len(unique_dirs))
    for repo_dir in unique_dirs:
        if os.path.isdir(repo_dir):
            pruned = reconcile_cold_boot(repo_dir, dry_run=dry_run)
            total_pruned += pruned

    logger.info("Reconciliation sweep complete. Pruned %d total stale worktree(s).", total_pruned)
    return total_pruned


def background_reconciliation_worker(interval_seconds: int = 30, dry_run: bool = False) -> None:
    """Periodically check all registered repositories for closed/merged PRs in the background."""
    logger.info("Background periodic reconciliation thread started (interval: %ds).", interval_seconds)
    while True:
        try:
            time.sleep(interval_seconds)
            reconcile_all_registered(dry_run=dry_run)
        except Exception as exc:
            logger.error("Error in background periodic reconciliation: %s", exc)


class MultiRepoWebhookHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler supporting multi-repository GitHub webhook POST events."""

    fallback_dir: Optional[str] = None
    dry_run: bool = False

    def do_GET(self) -> None:
        """Health check endpoint."""
        if self.path == "/health":
            registry = load_registry()
            payload = {
                "status": "healthy",
                "registered_repos": len(set(registry.values())),
                "registry": registry,
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self) -> None:
        """Handle incoming webhook payload."""
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        if self.path in ("/events", "/webhook", "/"):
            try:
                event_data = json.loads(body.decode("utf-8"))
            except Exception as exc:
                logger.error("Invalid JSON body: %s", exc)
                self.send_response(400)
                self.end_headers()
                return

            action = event_data.get("action")
            pr = event_data.get("pull_request")

            if pr and action == "closed":
                merged = pr.get("merged", False)
                head_ref = pr.get("head", {}).get("ref")
                pr_number = pr.get("number")

                target_repo = find_local_repo_for_event(event_data, fallback_dir=self.fallback_dir)
                if not target_repo:
                    repo_slug = event_data.get("repository", {}).get("full_name", "unknown")
                    logger.warning("No registered local repository found on this machine for '%s'.", repo_slug)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(b'{"status": "ignored", "reason": "Repository not registered locally"}')
                    return

                logger.info("Matched PR #%s event to local repository '%s': merged=%s, head=%s", pr_number, target_repo, merged, head_ref)

                if head_ref:
                    status_desc = "merged" if merged else "closed without merge"
                    logger.info("[%s] PR #%s was %s. Triggering worktree and branch cleanup for '%s'.", os.path.basename(target_repo), pr_number, status_desc, head_ref)
                    cleaned = clean_worktree_and_branch(target_repo, head_ref, dry_run=self.dry_run)
                    res_body = {"status": "processed", "cleaned": cleaned, "branch": head_ref, "repo": target_repo, "merged": merged}
                else:
                    res_body = {"status": "ignored", "reason": "Missing head ref in PR payload"}

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res_body).encode("utf-8"))
                return

            if self.path == "/reconcile":
                count = reconcile_all_registered(dry_run=self.dry_run)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "reconciled", "pruned_count": count}).encode("utf-8"))
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "ignored", "reason": "Not a pull_request event"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format: str, *args) -> None:
        """Suppress default stderr logging."""
        logger.debug("%s - - [%s] %s", self.client_address[0], self.log_date_time_string(), format % args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Git Portable Webhook & Worktree Cleanup Daemon")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=9876, help="Port to listen on (default: 9876)")
    parser.add_argument("--register", metavar="PATH", help="Register a local repository path in machine registry")
    parser.add_argument("--list-repos", action="store_true", help="List registered repositories on this machine")
    parser.add_argument("--reconcile-all", action="store_true", help="Run cold-boot sweep across all registered repos")
    parser.add_argument("--repo-dir", default=None, help="Explicit repository path fallback")
    parser.add_argument("--no-reconcile", action="store_true", help="Skip startup cold-boot reconciliation")
    parser.add_argument("--poll-interval", type=int, default=0, help="Periodic reconciliation interval in seconds (default: 0 = disabled, sweeps handled by 24h timer)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate actions without deleting files")
    args = parser.parse_args()

    if args.register:
        register_repo(args.register)
        return

    if args.list_repos:
        registry = load_registry()
        print("\nRegistered Repositories on this Machine:")
        if not registry:
            print("  (None registered yet. Run: skills-sync daemon register <path>)")
        else:
            for slug, path in sorted(registry.items()):
                print(f"  {slug:40s} -> {path}")
        print("")
        return

    if args.reconcile_all:
        reconcile_all_registered(dry_run=args.dry_run)
        return

    # Auto-register current repository if inside one
    code, out, _ = run_cmd(["git", "rev-parse", "--show-toplevel"])
    current_git_root = out if code == 0 and out else None
    if current_git_root:
        register_repo(current_git_root)

    # Cold-Boot Catch-Up Reconciliation across all registered repos
    if not args.no_reconcile:
        reconcile_all_registered(dry_run=args.dry_run)

    MultiRepoWebhookHandler.fallback_dir = args.repo_dir or current_git_root
    MultiRepoWebhookHandler.dry_run = args.dry_run

    # Start background periodic reconciliation worker thread only if requested
    if args.poll_interval > 0:
        recon_thread = threading.Thread(
            target=background_reconciliation_worker,
            args=(args.poll_interval, args.dry_run),
            daemon=True,
        )
        recon_thread.start()

    server = http.server.ThreadingHTTPServer((args.host, args.port), MultiRepoWebhookHandler)
    logger.info("Multi-Repository Git Webhook Daemon listening on http://%s:%d/events", args.host, args.port)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Daemon stopped by user.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
