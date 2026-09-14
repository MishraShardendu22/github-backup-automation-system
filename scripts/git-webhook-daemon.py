#!/usr/bin/env python3
"""
git-webhook-daemon.py — Event-driven local development cleanup daemon.

Listens for GitHub webhook events forwarded via `gh webhook forward`
(specifically `pull_request.closed` where `merged == True`).
Safely removes linked ephemeral git worktrees and deletes merged local branches.
Also performs cold-boot offline catch-up reconciliation on startup.
"""

import argparse
import http.server
import json
import logging
import os
import shutil
import subprocess
import sys
from typing import Dict, List, Optional, Tuple

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("git-webhook-daemon")


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
            # format: branch refs/heads/<branch-name>
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
    return code == 0 and len(out) > 0


def clean_worktree_and_branch(repo_dir: str, branch: str, dry_run: bool = False) -> bool:
    """
    Safely remove the worktree and delete the local branch for a merged PR.
    Guarantees that dirty worktrees are NEVER pruned.
    """
    logger.info("Processing cleanup for merged branch: %s", branch)
    worktrees = get_active_worktrees(repo_dir)

    # 1. Locate worktree attached to this branch
    matching_wt: Optional[Dict[str, str]] = None
    for wt in worktrees:
        if wt.get("branch") == branch:
            matching_wt = wt
            break

    if matching_wt:
        wt_path = matching_wt.get("path", "")
        # Prevent accidentally pruning the main repo directory
        if os.path.abspath(wt_path) == os.path.abspath(repo_dir):
            logger.warning("Worktree path is the primary repository root (%s). Skipping worktree removal.", wt_path)
        else:
            # Safety Check: Is worktree dirty?
            if is_worktree_dirty(wt_path):
                logger.warning(
                    "[SAFETY LOCK] Worktree at %s has uncommitted changes! Refusing to auto-delete.",
                    wt_path,
                )
                send_notification(
                    "Worktree Protected",
                    f"Branch '{branch}' was merged, but '{wt_path}' contains uncommitted changes. Kept on disk.",
                )
                return False

            logger.info("Removing clean worktree at: %s", wt_path)
            if not dry_run:
                code, _, err = run_cmd(["git", "worktree", "remove", wt_path, "--force"], cwd=repo_dir)
                if code != 0:
                    logger.error("Failed to remove worktree %s: %s", wt_path, err)
                    return False
                run_cmd(["git", "worktree", "prune"], cwd=repo_dir)
                logger.info("Successfully pruned worktree: %s", wt_path)

    # 2. Delete local branch if it exists
    code, branches, _ = run_cmd(["git", "branch", "--list", branch], cwd=repo_dir)
    if code == 0 and branch in branches:
        logger.info("Deleting local branch: %s", branch)
        if not dry_run:
            code, _, err = run_cmd(["git", "branch", "-D", branch], cwd=repo_dir)
            if code != 0:
                logger.error("Failed to delete branch %s: %s", branch, err)
                return False
            logger.info("Successfully deleted local branch: %s", branch)

    send_notification("PR Cleanup Complete", f"Worktree and branch '{branch}' successfully pruned.")
    return True


def reconcile_cold_boot(repo_dir: str, dry_run: bool = False) -> int:
    """
    Cold-Boot Catch-Up Reconciliation:
    Queries GitHub CLI for recently merged PRs and prunes any active local worktrees.
    Runs immediately on startup before listening to live webhooks.
    """
    logger.info("Running cold-boot reconciliation for repository: %s", repo_dir)
    if not shutil.which("gh"):
        logger.warning("GitHub CLI ('gh') not found. Skipping cold-boot reconciliation.")
        return 0

    code, out, err = run_cmd(
        ["gh", "pr", "list", "--state", "merged", "--limit", "50", "--json", "headRefName"],
        cwd=repo_dir,
    )
    if code != 0:
        logger.warning("Failed to query merged PRs via gh CLI: %s", err)
        return 0

    try:
        data = json.loads(out)
        merged_branches = {item["headRefName"] for item in data if "headRefName" in item}
    except Exception as exc:
        logger.error("Failed to parse gh output: %s", exc)
        return 0

    worktrees = get_active_worktrees(repo_dir)
    pruned_count = 0

    for wt in worktrees:
        branch = wt.get("branch")
        if branch and branch in merged_branches:
            wt_path = wt.get("path", "")
            if os.path.abspath(wt_path) != os.path.abspath(repo_dir):
                logger.info("Reconciliation: Found merged worktree for branch '%s' at '%s'", branch, wt_path)
                if clean_worktree_and_branch(repo_dir, branch, dry_run=dry_run):
                    pruned_count += 1

    logger.info("Cold-boot reconciliation completed. Pruned %d stale worktree(s).", pruned_count)
    return pruned_count


class WebhookHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler for GitHub webhook POST events."""

    repo_dir: str = os.getcwd()
    dry_run: bool = False

    def do_GET(self) -> None:
        """Health check endpoint."""
        if self.path == "/health":
            worktrees = get_active_worktrees(self.repo_dir)
            payload = {
                "status": "healthy",
                "repo_dir": self.repo_dir,
                "active_worktrees": len(worktrees),
                "worktrees": worktrees,
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

                logger.info("Received PR #%s event: action=%s, merged=%s, head=%s", pr_number, action, merged, head_ref)

                if merged and head_ref:
                    cleaned = clean_worktree_and_branch(self.repo_dir, head_ref, dry_run=self.dry_run)
                    res_body = {"status": "processed", "cleaned": cleaned, "branch": head_ref}
                else:
                    res_body = {"status": "ignored", "reason": "PR closed but not merged"}

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res_body).encode("utf-8"))
                return

            # Reconcile trigger endpoint
            if self.path == "/reconcile":
                count = reconcile_cold_boot(self.repo_dir, dry_run=self.dry_run)
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
        """Suppress standard BaseHTTPRequestHandler stderr logging."""
        logger.debug("%s - - [%s] %s", self.client_address[0], self.log_date_time_string(), format % args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Git Local Webhook & Worktree Cleanup Daemon")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=9876, help="Port to listen on (default: 9876)")
    parser.add_argument("--repo-dir", default=None, help="Repository path (default: current git root)")
    parser.add_argument("--no-reconcile", action="store_true", help="Skip cold-boot startup reconciliation")
    parser.add_argument("--dry-run", action="store_true", help="Simulate actions without deleting files")
    args = parser.parse_args()

    # Determine git repo root
    repo_dir = args.repo_dir
    if not repo_dir:
        code, out, _ = run_cmd(["git", "rev-parse", "--show-toplevel"])
        repo_dir = out if code == 0 and out else os.getcwd()

    logger.info("Initializing Git Webhook Daemon for repo: %s", repo_dir)

    # Cold-Boot Catch-Up Reconciliation
    if not args.no_reconcile:
        reconcile_cold_boot(repo_dir, dry_run=args.dry_run)

    WebhookHandler.repo_dir = repo_dir
    WebhookHandler.dry_run = args.dry_run

    server = http.server.ThreadingHTTPServer((args.host, args.port), WebhookHandler)
    logger.info("Server listening at http://%s:%d/events", args.host, args.port)
    logger.info("Forward webhooks using: gh webhook forward --repo=<owner>/<repo> --events=pull_request --url=http://%s:%d/events", args.host, args.port)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Daemon stopped by user.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
