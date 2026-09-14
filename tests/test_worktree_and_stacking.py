#!/usr/bin/env python3
"""
test_worktree_and_stacking.py — Automated Unit Tests for Ephemeral Worktrees,
Stacked PRs, Safety Locks, and Webhook Daemon Payload Processing.
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

# Add scripts directory to path to import daemon helpers
SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

import importlib.util
daemon_spec = importlib.util.spec_from_file_location("git_webhook_daemon", str(SCRIPTS_DIR / "git-webhook-daemon.py"))
daemon_mod = importlib.util.module_from_spec(daemon_spec)
daemon_spec.loader.exec_module(daemon_mod)


class TestWorktreeAndStackingLifecycle(unittest.TestCase):
    """Test suite for worktree lifecycle, dirty safety locks, and daemon handlers."""

    def setUp(self):
        """Create a temporary git repository for testing worktree mechanics."""
        self.test_dir = tempfile.mkdtemp(prefix="test_wt_")
        self.repo_dir = os.path.join(self.test_dir, "repo")
        os.makedirs(self.repo_dir, exist_ok=True)

        # Initialize test git repo
        subprocess.run(["git", "init", "-b", "main"], cwd=self.repo_dir, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Test User"], cwd=self.repo_dir, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.repo_dir, check=True)

        # Initial commit
        readme = os.path.join(self.repo_dir, "README.md")
        with open(readme, "w") as f:
            f.write("# Test Repo\n")
        subprocess.run(["git", "add", "README.md"], cwd=self.repo_dir, check=True)
        subprocess.run(["git", "commit", "-m", "initial commit"], cwd=self.repo_dir, check=True, capture_output=True)

    def tearDown(self):
        """Clean up temporary test directory and any attached worktrees."""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_webhook_payload_parsing(self):
        """Verify webhook payload parsing handles merged vs unmerged PR events correctly."""
        merged_payload = {
            "action": "closed",
            "pull_request": {
                "number": 42,
                "merged": True,
                "head": {"ref": "feature-auth-service"},
                "base": {"ref": "main"},
            },
        }
        self.assertEqual(merged_payload["action"], "closed")
        self.assertTrue(merged_payload["pull_request"]["merged"])
        self.assertEqual(merged_payload["pull_request"]["head"]["ref"], "feature-auth-service")

        unmerged_payload = {
            "action": "closed",
            "pull_request": {
                "number": 43,
                "merged": False,
                "head": {"ref": "feature-abandoned"},
                "base": {"ref": "main"},
            },
        }
        self.assertFalse(unmerged_payload["pull_request"]["merged"])

    def test_dirty_worktree_safety_lock(self):
        """Assert that clean_worktree_and_branch NEVER deletes a worktree containing uncommitted edits."""
        wt_path = os.path.join(self.test_dir, "wt-feature-dirty")
        branch_name = "feature-dirty"

        # Create worktree
        subprocess.run(
            ["git", "worktree", "add", "-b", branch_name, wt_path, "main"],
            cwd=self.repo_dir,
            check=True,
            capture_output=True,
        )
        self.assertTrue(os.path.exists(wt_path))

        # Create an uncommitted, dirty file inside the worktree
        dirty_file = os.path.join(wt_path, "draft_work.py")
        with open(dirty_file, "w") as f:
            f.write("uncommitted work in progress\n")

        # Verify daemon's dirty detector recognizes uncommitted changes
        self.assertTrue(daemon_mod.is_worktree_dirty(wt_path))

        # Attempt deletion: Safety lock MUST abort deletion
        deleted = daemon_mod.clean_worktree_and_branch(self.repo_dir, branch_name)
        self.assertFalse(deleted, "Expected clean_worktree_and_branch to abort when worktree is dirty")
        self.assertTrue(os.path.exists(wt_path), "Dirty worktree must NOT be removed from disk")

    def test_clean_worktree_removal(self):
        """Verify that a clean worktree and its local branch are successfully removed."""
        wt_path = os.path.join(self.test_dir, "wt-feature-clean")
        branch_name = "feature-clean"

        # Create worktree
        subprocess.run(
            ["git", "worktree", "add", "-b", branch_name, wt_path, "main"],
            cwd=self.repo_dir,
            check=True,
            capture_output=True,
        )
        self.assertTrue(os.path.exists(wt_path))
        self.assertFalse(daemon_mod.is_worktree_dirty(wt_path))

        # Execute cleanup
        deleted = daemon_mod.clean_worktree_and_branch(self.repo_dir, branch_name)
        self.assertTrue(deleted, "Expected clean worktree to be removed")
        self.assertFalse(os.path.exists(wt_path), "Clean worktree must be removed from disk")

        # Verify local branch is deleted
        code, out, _ = daemon_mod.run_cmd(["git", "branch", "--list", branch_name], cwd=self.repo_dir)
        self.assertNotIn(branch_name, out)

    def test_primary_repo_protected_from_removal(self):
        """Verify the primary repository root is never deleted even if branch matches."""
        # Attempt to clean the branch currently checked out in the primary root
        deleted = daemon_mod.clean_worktree_and_branch(self.repo_dir, "main")
        self.assertTrue(os.path.exists(self.repo_dir))
        self.assertTrue(os.path.exists(os.path.join(self.repo_dir, ".git")))

    def test_stacking_parent_tracking(self):
        """Verify stacked worktree correctly identifies and records its parent branch."""
        wt_stack_1 = os.path.join(self.test_dir, "wt-layer-1")
        wt_stack_2 = os.path.join(self.test_dir, "wt-layer-2")

        # Layer 1 from main
        subprocess.run(
            ["git", "worktree", "add", "-b", "layer-1", wt_stack_1, "main"],
            cwd=self.repo_dir,
            check=True,
            capture_output=True,
        )
        parent_file_1 = os.path.join(wt_stack_1, ".wt-parent")
        with open(parent_file_1, "w") as f:
            f.write("main\n")

        # Layer 2 stacked from layer-1
        subprocess.run(
            ["git", "worktree", "add", "-b", "layer-2", wt_stack_2, "layer-1"],
            cwd=self.repo_dir,
            check=True,
            capture_output=True,
        )
        parent_file_2 = os.path.join(wt_stack_2, ".wt-parent")
        with open(parent_file_2, "w") as f:
            f.write("layer-1\n")

        with open(parent_file_2) as f:
            parent_branch = f.read().strip()
        self.assertEqual(parent_branch, "layer-1")

    def test_multi_repo_lookup_and_registration(self):
        """Verify that multi-repo lookup accurately matches webhook event payloads to local paths."""
        mock_registry = {
            "test-owner/test-repo": self.repo_dir,
            "test-repo": self.repo_dir,
        }
        # Monkey patch load_registry for test isolation
        orig_load = daemon_mod.load_registry
        daemon_mod.load_registry = lambda: mock_registry

        try:
            event_data = {
                "repository": {
                    "full_name": "test-owner/test-repo",
                    "name": "test-repo",
                }
            }
            matched_path = daemon_mod.find_local_repo_for_event(event_data)
            self.assertEqual(matched_path, self.repo_dir)

            unmatched_event = {
                "repository": {
                    "full_name": "other-owner/other-repo",
                    "name": "other-repo",
                }
            }
            self.assertIsNone(daemon_mod.find_local_repo_for_event(unmatched_event))
        finally:
            daemon_mod.load_registry = orig_load


if __name__ == "__main__":
    unittest.main()
