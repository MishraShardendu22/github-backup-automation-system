---
name: repository-maintenance
description: >-
  Procedures for database schema integrity, idempotent migrations, backup/restore execution,
  and dependency maintenance.
---

# Repository Maintenance Skill

This skill provides procedures for maintaining database integrity, executing database backups, applying schema migrations, and managing dependencies across repositories.

---

## 1. Local Branch-First Development

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST**: Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Never apply maintenance or schema changes directly on `main`.

---

## 2. Database Schema Integrity & Migrations

> [!CAUTION]
> **CRITICAL RULE**: Never execute destructive SQL statements (`DROP TABLE`, `TRUNCATE`) in production environments.

### Migration Rules
- All migrations MUST be located in a versioned migrations directory (e.g. `db/migrations/` or `migrations/`) using timestamped or numbered files (`NNNNNN_<name>.up.sql` and `NNNNNN_<name>.down.sql`).
- All SQL statements MUST be idempotent:
  - `CREATE TABLE IF NOT EXISTS ...`
  - `CREATE INDEX IF NOT EXISTS ...`
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`

---

## 3. Backup & Disaster Recovery Runbook

PostgreSQL database dumps should be automated with SHA-256 integrity verification:

```bash
# 1. Execute an automated database backup
make backup-db

# 2. Restore database from a backup file
make restore-db BACKUP_FILE=backups/postgres/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## 4. Dependency Management

- **Go Dependencies**: Managed via `go.mod`. Update with `go get -u` and clean with `go mod tidy`.
- **Python Dependencies**: Managed via `uv`. Update with `uv lock --upgrade` and sync with `uv sync`.
- **Frontend Dependencies**: Managed via `pnpm`. Update with `pnpm update`. Ensure lockfiles remain frozen in CI.
