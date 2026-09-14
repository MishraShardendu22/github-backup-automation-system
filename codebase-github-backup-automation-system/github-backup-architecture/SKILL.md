---
name: github-backup-architecture
scope: codebase-github-backup-automation-system
description: >-
  Comprehensive system architecture, inter-service communication protocols, database schema, and deployment boundaries for the GitHub Backup Automation System monorepo.
---

# GitHub Backup Automation System — Architecture Guide

> [!IMPORTANT]
> **CODEBASE-SPECIFIC SCOPE**: This skill is strictly specific to the **GitHub Backup Automation System** (`github-backup-automation-system`). It provides concrete architecture, schema, and deployment runbooks for this codebase.

---

## 1. System Topology

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                      │
│                  (Deployed on Vercel Edge)                  │
└───────────────┬─────────────────────────────┬───────────────┘
                │ REST / SSE                  │ REST / WebSocket
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     Python Observatory      │ │         Go Backend          │
│    (Deployed on Vercel)     │ │    (Deployed on Render)     │
│   FastAPI · LangChain AI    │ │  Fiber v2 · Live WS Stream  │
└───────────────┬─────────────┘ └─────────────┬───────────────┘
                │                             │
                │     ┌─────────────────┐     │
                ├────►│ Neon PostgreSQL │◄────┤
                │     │ (pgvector + FTS)│     │
                │     └────────┬────────┘     │
                │              ▲              │
                │              │ Sync         │
                │     ┌────────┴────────┐     │
                │     │ Backup Worker   │     │
                │     │ (CLI / Cron)    │     │
                │     └─────────────────┘     │
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     OpenRouter AI APIs      │ │     SMTP Email Service      │
│ (Multi-Key Failover Pool)   │ │  (Human-In-The-Loop Alerts) │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Service Responsibilities & Configuration Modules

### Next.js Frontend (`frontend/`)
- **Framework**: Next.js 16 App Router with Turbopack, Tailwind CSS, Biome linter, TypeScript.
- **Responsibilities**: Unified Dashboard, AI Chat Interface, Vector Search Playground, Real-time WebSocket Log Streaming, Human-in-the-Loop Action Approvals.
- **Config**: `frontend/src/config/env.ts` (Never call `process.env` directly in UI components).

### Python Observatory (`agentic-observatory/`)
- **Framework**: FastAPI, LangChain, asyncpg, SQLAlchemy, httpx, Jinja2, uv package manager.
- **Responsibilities**:
  - Multi-turn AI Agent reasoning loop (`invoke_agent`, `stream_agent`).
  - Hybrid Search: PostgreSQL Full-Text Search (`tsvector`) + pgvector cosine similarity + Reciprocal Rank Fusion (RRF).
  - Background embedding generation pipeline (`embedding_generations`, `embedding_jobs`, `embedding_chunks`).
  - Human-in-the-loop report generation and SMTP email dispatch (`send_report_email`).
  - JWT Authentication for dashboard chat.
- **Config**: `agentic-observatory/config/settings.py`.

### Go Backend (`backend/`)
- **Framework**: Go Fiber v2, pgxpool connection pool.
- **Responsibilities**:
  - Ingesting backup execution runs, repository results, and structured logs from the worker.
  - Serving real-time WebSocket hub for active backup runs (`/ws`).
  - Exposing database metrics and system telemetry.
- **Config**: `backend/config/config.go`.

### Backup Worker (`backup-worker/`)
- **Framework**: Go CLI (`backup-worker/main.go`).
- **Responsibilities**:
  - Discovering repositories from GitHub Organizations & Personal accounts.
  - Cloning / pulling mirrors locally into `backup-worker/_Repos/`.
  - Caching remote HEAD commit hashes in `backup-worker/app.db`.
  - Recording telemetry, logs, and failure fixes to PostgreSQL.
- **Config**: `backup-worker/config/data.config.go`.

---

## 3. Database Schema Specification

All migrations reside in `backend/db/migrations/` and run automatically on Go backend startup:

1. `backup_runs`: Stores each backup batch (ID, status, total repos, duration, timestamps, error_message).
2. `backup_results`: Per-repository outcome (status, error_message, sizes, commit_hash).
3. `execution_logs`: Structured step-by-step logs with GIN index for full-text search.
4. `analytics_snapshots`: Aggregated metrics and commit snapshots over time (1-to-1 unique with backup_runs).
5. `backup_fixes` & `backup_run_fixes`: Historical failure resolutions and commit tags.
6. `ai_chat_sessions` & `ai_session_metadata`: Normalized conversation sessions and key-value metadata.
7. `ai_chat_messages` & `ai_tool_calls`: Chat history and granular tool execution telemetry.
8. `investigations`: Saved agent investigation traces, tool calls, and results.
9. `embedding_generations`, `embedding_jobs`, `embedding_chunks`: Vector index and chunk storage with pgvector and deterministic blue-green lifecycle management.
