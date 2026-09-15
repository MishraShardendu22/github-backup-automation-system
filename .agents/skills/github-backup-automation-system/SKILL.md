---
name: github-backup-automation-system
scope: codebase-github-backup-automation-system
description: >-
  System architecture, inter-service topology, database schemas, and AI observatory development runbooks for the GitHub Backup Automation System monorepo.
---

# GitHub Backup Automation System — AI Agent Skills Suite

> [!IMPORTANT]
> **CODEBASE-SPECIFIC SCOPE**: These skills are strictly specific to the **GitHub Backup Automation System** (`github-backup-automation-system`). They provide concrete architecture topologies, service boundaries, and AI agent observatory runbooks for this codebase.

---

## Skills Catalog

This directory contains the following dedicated skills:

| Skill File | Scope | Domain | Description |
| :--- | :--- | :--- | :--- |
| [`github-backup-architecture.md`](github-backup-architecture.md) | `codebase-github-backup-automation-system` | System Architecture | End-to-end system topology, service responsibilities (`frontend`, `agentic-observatory`, `backend`, `backup-worker`), and PostgreSQL database schema. |
| [`agentic-observatory-workflow.md`](agentic-observatory-workflow.md) | `codebase-github-backup-automation-system` | AI Observatory | Adding tools to `agentic-observatory/data/tools/`, Tool-Calling RAG workflows, HITL email alerts, and OpenRouter multi-key pool failover. |
