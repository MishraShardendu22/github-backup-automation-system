---
name: code-quality-and-validation
description: >-
  Standards, tools, and commands for code formatting, linting, and static type checking
  across Go, Python, and TypeScript.
---

# Code Quality & Validation Standards

This skill defines the multi-tier code quality, formatting, linting, and type checking standards across polyglot repositories.

---

## 1. Local Branch-First Development

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST**: Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Never develop code or run refactors directly on `main`.

---

## 2. Tooling Matrix by Language

| Language | Subsystem | Formatter | Linter | Static Type Checker |
| :--- | :--- | :--- | :--- | :--- |
| **Go** | Backend & CLI | `gofmt` | `go vet ./...` | Go Compiler (`go build ./...`) |
| **Python** | AI & Services | Ruff / Black compatible | Ruff check / Pyright | Pyright (`uv run --with pyright pyright`) |
| **TypeScript** | Frontend & Web | Biome (`pnpm run format`) | Biome (`biome check`) | TypeScript Compiler (`tsc --noEmit`) |

---

## 3. Code Quality Rules

### 1. Go Guidelines
- Always format code using standard `gofmt` before committing.
- Zero compiler warnings or `go vet` issues allowed.
- Prefer structured logging via standard library `slog`.
- Clean up goroutines and database connection handles using `defer`.

### 2. Python Service Guidelines
- Python 3.12+ type annotations required on all function arguments, return types, and Pydantic models.
- Zero errors in Pyright type checking (`pyrightconfig.json`).
- Ensure all async functions and database sessions are properly awaited and closed.

### 3. Frontend TypeScript Guidelines
- Strict TypeScript checks with zero `any` types wherever possible.
- Use Biome for combined linting and code formatting (`package.json`).
- Ensure components render cleanly in production builds.

---

## 4. Developer CLI Runbook

```bash
# Auto-format all Go and TypeScript files
make format

# Run all linters across Go, Python, and Frontend
make lint

# Run static type checkers across Python and Frontend
make typecheck

# Full pre-commit validation pass
make pre-commit
```
