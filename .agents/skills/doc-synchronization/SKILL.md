---
name: doc-synchronization
description: >-
  High-priority rules and automated procedures for continuously keeping repository documentation, API references,
  architecture guides, changelogs, and agent skills synchronized with code changes autonomously without requiring human reminders.
---

# Autonomous Documentation & Skill Synchronization Engine

This skill establishes the **Zero-Reminder Automatic Synchronization Rule**: whenever ANY code, API, database schema, workflow, or architecture change is introduced or modified in the repository, all corresponding architectural documents, API references, READMEs, changelogs, and AI agent skills (`.agents/skills/`) MUST be automatically inspected, updated, and expanded by the agent **without requiring any prompting or reminders from the human user**.

---

## 1. High-Priority Rule: Zero-Reminder Automatic Synchronization

> [!IMPORTANT]
> **AUTONOMOUS DOCUMENTATION & SKILL UPDATES (No Human Prompting Needed)**:
> - AI agents are strictly required to treat **Agent Skills (`.agents/skills/`)** and **Documentation (`docs/`, `README.md`, `CHANGELOG.md`)** as first-class codebase artifacts.
> - Every feature addition (`feat`), improvement (`perf`/`refactor`), bug fix (`fix`), database migration (`db`), or DevOps pipeline (`ci`) MUST automatically trigger a synchronization pass across relevant skills and markdown specifications before finalizing commits.
> - The human developer should **NEVER** have to ask: *"please update the docs"* or *"please update the agent skills"*. This is a mandatory, automated built-in reflex.

---

## 2. Universal Subsystem-to-Documentation Synchronization Matrix

Whenever modifying files in any subsystem, the agent MUST automatically update the corresponding documentation and skill files:

| Subsystem Modified | Typical Source Locations | Target Documentation & Skill Updates |
| :--- | :--- | :--- |
| **Git Workflow & Branching** | `.githooks/`, `scripts/git-*.sh`, `.github/workflows/` | `.agents/skills/git-commit-workflow/SKILL.md`<br>`.agents/skills/git-branch-management/SKILL.md`<br>`.agents/skills/git-post-merge-cleanup/SKILL.md`<br>`docs/GIT_WORKFLOW.md`<br>`CHANGELOG.md` |
| **Database & Migrations** | `db/migrations/`, `backend/db/`, `migrations/` | `.agents/skills/repository-maintenance/SKILL.md`<br>`.agents/skills/polyglot-microservice-architecture/SKILL.md`<br>`docs/ARCHITECTURE.md`<br>`README.md`<br>`CHANGELOG.md` |
| **AI Agents & RAG** | `agent/`, `ai-service/`, `tools/`, `utils/rag.py` | `.agents/skills/agent-observatory-workflow/SKILL.md`<br>`docs/ARCHITECTURE.md`<br>`docs/AI_AGENT_WORKFLOW.md`<br>`CHANGELOG.md` |
| **SaaS Connectors & Cloud Storage** | `connectors/`, `storage/`, `integrations/` | `.agents/skills/saas-and-mcp-architecture/SKILL.md`<br>`docs/ARCHITECTURE.md`<br>`CHANGELOG.md` |
| **Model Context Protocol (MCP)** | `mcp/`, `tools/mcp/`, server handlers | `.agents/skills/saas-and-mcp-architecture/SKILL.md`<br>`docs/MCP_GUIDE.md`<br>`CHANGELOG.md` |
| **Backend & REST/WebSocket APIs** | `backend/`, `handlers/`, `routes/`, `api/` | `docs/API_REFERENCE.md`<br>`docs/ARCHITECTURE.md`<br>`backend/README.md`<br>`CHANGELOG.md` |
| **Workers & Background Daemons** | `worker/`, `cmd/worker/`, `service/` | `docs/ARCHITECTURE.md`<br>`worker/README.md`<br>`CHANGELOG.md` |
| **Frontend & UI Components** | `frontend/`, `web/`, `src/components/` | `README.md`<br>`frontend/README.md`<br>`CHANGELOG.md` |
| **CI/CD & Containerization** | `.github/workflows/`, `*Dockerfile`, `docker-compose.yml`, `render.yaml`, `vercel.json` | `.agents/skills/ci-cd-workflow/SKILL.md`<br>`.agents/skills/docker-first-architecture/SKILL.md`<br>`docs/DEPLOYMENT_GUIDE.md`<br>`CHANGELOG.md` |

---

## 3. Autonomous Skill Creation & Evolution Rule

- **When to Create a New Agent Skill (`.agents/skills/<name>/SKILL.md`)**:
  - Whenever introducing a new architectural pattern, operational domain, or subsystem that future AI agents must interact with or maintain (e.g. `saas-and-mcp-architecture`, `git-post-merge-cleanup`, `cli-tooling-guide`).
  - Format: Include YAML frontmatter (`name`, `description`) and comprehensive operational guidelines, rules, and example commands.
- **When to Update Existing Skills**:
  - Whenever modifying runtime behaviors, adding flags to scripts, updating CLI commands, or changing deployment configurations.
  - Keep skills concise, actionable, and strictly synchronized with the live implementation.

---

## 4. Pre-Commit Autonomous Synchronization Checklist

Before executing `git commit` or finalizing any milestone, execute this 5-step checklist:

1. **Inspect Staged/Modified Files**:
   ```bash
   git status --short
   ```
2. **Cross-Reference Subsystem Matrix**: Identify all target docs and agent skills impacted by the modified files.
3. **Apply Documentation & Skill Edits**: Update markdown files and skills with exact details.
4. **Log in Changelog**: Add concise bullet points under `## [Unreleased]` in `CHANGELOG.md`.
5. **Sync Skills Upstream**: If any skill inside `.agents/skills/` was added or modified, execute `skills-sync push` to propagate updates to the central skills catalog.
