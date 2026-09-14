---
name: git-worktree-management
description: >-
  Standard operating procedure for ephemeral Git worktree isolation, directory conventions,
  branch-to-worktree 1:1 mapping, dirty-state protection, and multi-agent safety.
scope: generic
---

# Git Worktree Management & Isolation Architecture

This skill defines the official standards and automated procedures for utilizing Git worktrees to isolate tasks, feature developments, bug fixes, and autonomous AI agent operations without dirtying or modifying the primary working tree.

---

## 1. Overview & Core Motivation

Standard single-directory Git checkouts force context switching in place, causing:
- Cache invalidation (`node_modules`, `.venv`, build artifacts).
- Inability for developers and AI agents to work on multiple tasks in parallel.
- Accidental leakage of uncommitted changes across unrelated branches.

Git worktrees solve this by allowing multiple working directories attached to the same Git repository simultaneously. Every task operates in its own isolated filesystem path while sharing the common `.git` object database.

---

## 2. Directory Layout & Storage Invariants

All ephemeral worktrees must be located within a standardized, git-ignored directory:

```text
<repo-root>/
├── .worktrees/                     # Git-ignored worktrees root
│   ├── wt-feat-docker-skills/      # Linked to branch: <user>/main/feat-docker-skills
│   ├── wt-fix-validator-regex/     # Linked to branch: <user>/main/fix-validator-regex
│   └── wt-refactor-sync-cli/       # Linked to branch: <user>/main/refactor-sync-cli
```

### Path & Naming Rules:
1. **Root Directory**: Worktrees must be located under `<repo-root>/.worktrees/` (or an external sibling directory specified by `$GIT_WORKTREE_DIR`).
2. **Directory Naming**: Must use prefix `wt-<branch-slug>` where `<branch-slug>` matches the descriptor of the branch (e.g., `wt-feat-docker-skills`).
3. **Ignore Rule**: The `.worktrees/` directory must be strictly listed in the repository's `.gitignore`.

---

## 3. Core Directives & Safety Invariants

> [!IMPORTANT]
> **1:1 BRANCH-TO-WORKTREE INVARIANT**: A branch may only be checked out in exactly ONE worktree at any given time. Never attempt to check out a branch that is already active elsewhere.

> [!CAUTION]
> **DIRTY STATE PROTECTION**: A worktree must NEVER be deleted or pruned if it contains uncommitted changes, untracked files, or unpushed commits. Always verify `git status --porcelain` before removal.

- **Isolation Principle**: All source modifications, dependency installations, and testing must happen exclusively inside the designated worktree.
- **Pristine Base**: The primary repository working directory must remain on `main` in a clean state (`working tree clean`).

---

## 4. Operational Runbook

### A. Creating a New Worktree & Branch
```bash
# 1. Ensure primary tree is up-to-date
git fetch origin main

# 2. Define branch name and slug
BRANCH_NAME="feat-database-connector"
WT_PATH=".worktrees/wt-${BRANCH_NAME}"

# 3. Create branch and worktree atomically from origin/main
git worktree add -b "$BRANCH_NAME" "$WT_PATH" origin/main

# 4. Navigate into isolated worktree
cd "$WT_PATH"
```

### B. Listing Active Worktrees
```bash
git worktree list
# Output format:
# /path/to/repo                          3a4b5c6 [main]
# /path/to/repo/.worktrees/wt-feature-a  7d8e9f0 [feat-feature-a]
```

### C. Safe Removal of Worktree
```bash
# 1. Navigate outside the worktree to be removed
cd "$(git rev-parse --show-toplevel)"

# 2. Assert no uncommitted changes exist
if [[ -n $(git -C "$WT_PATH" status --porcelain) ]]; then
  echo "ERROR: Worktree has uncommitted changes. Aborting." >&2
  exit 1
fi

# 3. Remove worktree directory and administrative files
git worktree remove "$WT_PATH"

# 4. Prune internal metadata
git worktree prune
```

---

## 5. Automation Integration

When using the repository synchronization tool:
```bash
# Create worktree and branch
skills-sync wt new feat-auth-service

# List active worktrees with upstream status
skills-sync wt list

# Sweep and clean merged or closed worktrees
skills-sync wt sweep
```
