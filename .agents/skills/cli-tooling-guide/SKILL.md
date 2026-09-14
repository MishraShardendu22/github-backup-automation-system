---
name: cli-tooling-guide
description: >-
  Standard operating guide for first-class authenticated CLI tools in the repository:
  GitHub CLI (gh), Google Jules CLI (jules), Vercel CLI (vercel), Neon CLI (neonctl), Docker CLI (docker), uv, and pnpm.
---

# Authenticated CLI Tooling & Operations Guide

This repository treats specialized developer CLI tools as first-class automation interfaces. AI agents and developers should prefer these authenticated CLIs over manual workflows.

---

## 1. Tooling Matrix & Authentication Overview

| Tool | CLI Binary | Auth Check Command | Primary Usage in System |
|---|---|---|---|
| **Google Jules CLI** | `jules` | `jules version` | Autonomous 38-dimension code review, remediation sessions, patch application |
| **GitHub CLI** | `gh` | `gh auth status` | Pull requests, issues, repo management, label sync, Actions monitoring |
| **Vercel CLI** | `vercel` | `vercel whoami` | Frontend and serverless deployments, preview inspection |
| **Neon CLI** | `neonctl` | `neonctl me` | Database branching, connection strings, migrations, schema isolation |
| **Docker CLI** | `docker` | `docker info` | Image builds, multi-stage validation, local test containers |
| **Python Package Manager** | `uv` | `uv --version` | Virtualenv management, dependency syncing, type checking |
| **Node.js Package Manager** | `pnpm` | `pnpm --version` | Frontend dependencies, Next.js build, Biome formatting/linting |
| **Go Toolchain** | `go` | `go version` | Backend API compilation, worker CLI execution, test suites |

---

## 2. Command Reference by Tool

### A. Google Jules CLI (`jules`)
* **Review PR**:
  ```bash
  ./scripts/jules-review-loop.sh --pr <pr-number>
  ```
* **Dispatch Remediation Task**:
  ```bash
  jules new --repo <owner>/<repo> "<task-prompt>"
  ```
* **List Active Sessions**:
  ```bash
  jules remote list --session
  ```
* **Pull and Apply Session Patch**:
  ```bash
  jules remote pull --session <session-id> --apply
  ```

### B. GitHub CLI (`gh`)
* **Create Pull Request**:
  ```bash
  gh pr create --base main --head <branch-name> --assignee "@me" --label "type/<type>,area/<area>,status/ready-for-review" --body "<body-markdown>"
  ```
* **View PR Status & Checks**:
  ```bash
  gh pr status
  gh pr checks <pr-number>
  ```
* **Check Actions Runs**:
  ```bash
  gh run list --limit 10
  ```

### C. Neon CLI (`neonctl`)
* **List Branches**:
  ```bash
  neonctl branches list --project-id <project-id> --output json
  ```
* **Create Ephemeral Staging Branch**:
  ```bash
  neonctl branches create --project-id <project-id> --name <branch-name> --parent production --output json
  ```
* **Get Connection String**:
  ```bash
  neonctl connection-string <branch-name> --project-id <project-id> --ssl require
  ```

### D. Vercel CLI (`vercel`)
* **Inspect Deployments**:
  ```bash
  vercel ls
  ```
* **Deploy Preview**:
  ```bash
  vercel deploy
  ```

### E. Python Package Manager (`uv`)
* **Strict Rule**: Always use `uv`. Never invoke bare `pip install` or `python -m venv`.
* **Environment & Run**:
  ```bash
  uv venv
  uv sync
  uv run pytest
  uv add <pkg>
  ```

### F. Node.js Package Manager (`pnpm`)
* **Strict Rule**: Always use `pnpm`. Never invoke `npm` or `yarn`. Only commit `pnpm-lock.yaml`.
* **Dependencies & Build**:
  ```bash
  pnpm install
  pnpm add <pkg>
  pnpm up
  pnpm run build
  pnpm run test
  ```

---

## 3. Recovery & Re-Authentication Runbook

If any CLI tool reports authentication expiration or failure, alert the human developer with the exact command:

1. **GitHub CLI**: `gh auth login`
2. **Vercel CLI**: `vercel login`
3. **Neon CLI**: `neonctl auth`
4. **Docker Hub**: `docker login`
