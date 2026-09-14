---
name: ci-cd-workflow
description: >-
  Rules, architectures, and guidelines for maintaining GitHub Actions CI/CD workflows,
  Docker Hub image publishing, and automated deployments.
---

# CI/CD & Deployment Architecture Skill

This skill guides AI agents and contributors in maintaining GitHub Actions CI/CD pipelines, container image publishing, and automated deployments.

---

## 1. Local Branch-First Development & Commit Cadence

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST & COMMIT FREQUENTLY**:
> Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Commit at each logical milestone (`more commits = more explanatory work`). Never commit directly on `main`.

---

## 2. Multi-Environment CI/CD Pipeline

```yaml
jobs:
  backend-test:
    name: Backend Test & Build
    steps:
      - uses: actions/setup-go@v5
      - run: go test -v -race ./...
      - run: go build -v ./...

  service-test:
    name: Python Service Test & Lint
    steps:
      - uses: astral-sh/setup-uv@v5
      - run: uv sync
      - run: uv run pytest

  frontend-test:
    name: Frontend Lint & Build
    steps:
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run build
```

---

## 3. Local CI Mirroring Runbook

To guarantee that your changes pass CI before committing:

```bash
# 1. Run the pre-commit gate (exact mirror of CI checks)
make pre-commit

# 2. Alternatively, run individual CI jobs locally:
# Go Backend:
go test -v -race ./... && go build -v ./...

# Python Service:
uv run pytest

# Frontend:
pnpm run lint && pnpm run build
```

---

## 4. Secrets vs Centralized Configuration

- **Secrets**: Strictly defined in `.env` / CI Secrets and runtime dashboards (`DATABASE_URL`, `API_KEY`, `JWT_SECRET`).
- **Operational Defaults**: Centralized in code modules.
- Never hardcode secrets in CI workflow YAML or Git commits.
