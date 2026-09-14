---
name: codebase-simplification-guide
description: >-
  Rules and principles for keeping this codebase clean, minimal, maintainable, and free of unnecessary abstractions.
---

# Codebase Simplification & Maintenance Guide

This skill provides guidelines on how to keep repositories clean, avoid over-engineering, and maintain high developer velocity.

---

## 1. Local Branch-First Development

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST**: Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Never develop or modify code directly on `main`.

---

## 2. Core Principles

1. **Prune Speculative Abstractions**:
   - Do not create interfaces or wrapper layers that have only a single implementation unless required for mocking in tests.
   - Prefer straightforward, readable standard library code over heavy external frameworks.

2. **Centralized Configuration**:
   - Never call `os.Getenv` or `process.env` in arbitrary component or handler files.
   - All environment access must go through dedicated central modules (e.g. `config/env.ts`, `config/settings.py`, `config/config.go`).

3. **Zero Dead Code**:
   - Remove unused functions, structs, imports, scripts, and commented-out code during every refactoring pass.

4. **Safe Database Practices**:
   - Never drop or truncate production tables.
   - Always write idempotent migrations (`CREATE TABLE IF NOT EXISTS`).

5. **Pragmatic Tooling**:
   - Avoid creating custom scripts when existing verified CLI tools (`pnpm`, `uv`, `go`, `docker`) already provide native solutions.
