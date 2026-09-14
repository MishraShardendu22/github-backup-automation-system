# Codebase-Specific Skills: GitHub Backup Automation System

This directory houses specialized AI agent skills specific exclusively to the **GitHub Backup Automation System** (`github-backup-automation-system`) monorepo.

To maintain cross-repository purity, these skills are kept isolated from the universal `.agents/skills/` catalog.

---

## Skills Catalog

| Skill Name | Scope | Primary Responsibility |
|---|---|---|
| [`github-backup-architecture`](github-backup-architecture/SKILL.md) | `codebase-github-backup-automation-system` | End-to-end system topology, service responsibilities (`frontend`, `agentic-observatory`, `backend`, `backup-worker`), and PostgreSQL database schema. |
| [`agentic-observatory-workflow`](agentic-observatory-workflow/SKILL.md) | `codebase-github-backup-automation-system` | Adding tools to `agentic-observatory/data/tools/`, Tool-Calling RAG workflows, HITL email alerts, and OpenRouter multi-key pool failover. |
