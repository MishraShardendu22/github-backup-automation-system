---
name: polyglot-microservice-architecture
description: >-
  Architectural patterns, service boundaries, communication protocols, database schema guidelines,
  and deployment targets for polyglot systems (Next.js frontend, Python AI service, Go backend/worker, PostgreSQL).
---

# Polyglot Microservice Architecture Guide

This skill defines the architectural blueprint, service boundaries, inter-service communication protocols, database schema standards, and deployment targets for modern polyglot microservice systems.

---

## 1. Local Branch-First Development

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST**: Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Never develop or modify code directly on `main`.

---

## 2. System Topology

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│             (Deployed on Vercel / Cloudflare Edge)          │
└───────────────┬─────────────────────────────┬───────────────┘
                │ REST / SSE                  │ REST / WebSocket
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Python AI Service      │ │       Go Backend API        │
│   (FastAPI / LangChain)     │ │   (High-Throughput Fiber)   │
└───────────────┬─────────────┘ └─────────────┬───────────────┘
                │                             │
                │     ┌─────────────────┐     │
                ├────►│ PostgreSQL 16+  │◄────┤
                │     │ (pgvector + FTS)│     │
                │     └────────┬────────┘     │
                │              ▲              │
                │              │ Sync / Queue │
                │     ┌────────┴────────┐     │
                │     │ Worker Daemon   │     │
                │     │ (Go CLI / Cron) │     │
                │     └─────────────────┘     │
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       AI Model Providers    │ │    Notifications & Webhooks │
│  (Multi-Key Failover Pools) │ │     (SMTP / Slack / Alert)  │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 3. Service Boundaries & Responsibilities

### Next.js Frontend (`frontend/` or `web/`)
- **Framework**: Next.js App Router with Turbopack, Tailwind CSS, Biome linter, and TypeScript.
- **Responsibilities**:
  - Unified user interface, operational dashboards, and analytics charts.
  - Interactive AI chat streaming via Server-Sent Events (SSE).
  - Real-time status indicators via WebSockets.
  - Human-in-the-loop (HITL) approval interfaces.
- **Configuration**: Centralized typed configuration module (e.g. `src/config/env.ts`), avoiding direct `process.env` calls in UI components.

### Python AI & Observatory Service (`ai-service/` or `agent/`)
- **Framework**: FastAPI, LangChain / LiteLLM, asyncpg / SQLAlchemy, Pydantic v2.
- **Responsibilities**:
  - Autonomous multi-turn reasoning and tool invocation loops.
  - Hybrid search: Full-Text Search combined with pgvector cosine similarity and Reciprocal Rank Fusion (RRF).
  - Background embedding generation pipelines and vector indexing.
  - Token tracking, model routing, and multi-key failover handling.
- **Configuration**: Pydantic BaseSettings module (e.g. `config/settings.py`).

### Go Backend & REST APIs (`backend/` or `api/`)
- **Framework**: Go standard library or Go Fiber / Gin, pgx connection pool.
- **Responsibilities**:
  - High-throughput transaction ingestion, validation, and REST API routing.
  - Real-time WebSocket event broadcasting and pub/sub distribution.
  - Database telemetry, health probes, and structured metrics.
- **Configuration**: Centralized configuration struct (e.g. `config/config.go`).

### Background Worker Engine (`worker/` or `cmd/worker/`)
- **Framework**: Go CLI or Python daemon.
- **Responsibilities**:
  - Scheduled batch processing, queue polling, and asynchronous job execution.
  - Data ingestion, archive generation, and external API polling.
  - Heartbeat reporting and error telemetry back to the database.

---

## 4. Database Schema Design & Migration Standards

1. **Idempotency**: All database migration scripts must be fully idempotent:
   - `CREATE TABLE IF NOT EXISTS ...`
   - `CREATE INDEX IF NOT EXISTS ...`
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
2. **Zero Destructive Commands**: Never execute `DROP TABLE`, `TRUNCATE`, or destructive column removals in automated production scripts.
3. **Canonical Tables**:
   - `jobs` / `tasks`: Job identifiers, status transitions, payloads, timestamps, error records.
   - `execution_logs`: Structured, timestamped step execution logs for observability.
   - `analytics_snapshots`: Aggregated metrics and telemetry for dashboard reporting.
   - `ai_sessions` & `ai_messages`: Normalized conversation records and tool invocation histories.
   - `embedding_chunks`: Vector representations and metadata with HNSW vector indexing.
