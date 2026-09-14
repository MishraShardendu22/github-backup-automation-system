---
name: modern-toolchain-standard
description: >-
  Standard operating specification for modern developer toolchains across all repositories:
  mandatory pnpm over npm/yarn, mandatory uv over bare pip/venv, Biome formatting/linting,
  and Vitest test runner.
---

# Modern Toolchain Standard & Package Management Policy

This standard defines the mandatory tooling, package managers, formatters, and test runners across all services and repositories. AI agents and developers must strictly adhere to these specifications to guarantee deterministic, high-performance, and reproducible builds.

---

## 1. Node.js & TypeScript Ecosystem

### A. Mandatory Package Manager: `pnpm`
* **Strict Rule**: Always use `pnpm`. Never execute `npm install`, `npm add`, `npm update`, `yarn`, or `bun install` for dependency management in standard repositories unless explicitly overriding for upstream compatibility.
* **Lockfile Enforcement**:
  * Only `pnpm-lock.yaml` is tracked in version control.
  * Committing `package-lock.json` or `yarn.lock` is strictly prohibited and flagged as a lint/quality failure.
* **Standard Commands**:
  ```bash
  # Installing dependencies
  pnpm install

  # Adding dependencies
  pnpm add <package-name>
  pnpm add -D <dev-package-name>

  # Updating dependencies safely
  pnpm up
  pnpm up --latest

  # Running scripts
  pnpm run build
  pnpm run dev
  pnpm run test
  ```

### B. Formatting & Linting: `Biome`
* **Preference**: Prefer [Biome](https://biomejs.dev) over legacy ESLint + Prettier combinations where supported.
* **Standard Commands**:
  ```bash
  pnpm biome check --write .
  pnpm biome lint .
  pnpm biome format --write .
  ```

### C. Unit & Integration Testing: `Vitest`
* **Preference**: Prefer [Vitest](https://vitest.dev) over legacy Jest for ESM-native speed and Vite/Turbopack compatibility.
* **Standard Commands**:
  ```bash
  pnpm vitest run
  ```

---

## 2. Python Ecosystem

### A. Mandatory Package & Environment Manager: `uv`
* **Strict Rule**: Always use [`uv`](https://github.com/astral-sh/uv). Never execute bare `pip install`, `python -m venv`, `poetry`, or `pip-tools`.
* **Virtual Environment Management**:
  * Virtual environments are managed with `uv venv`.
  * Commands and scripts are executed inside the environment using `uv run`.
* **Standard Commands**:
  ```bash
  # Create virtual environment
  uv venv

  # Synchronize dependencies from lockfile
  uv sync

  # Add or update dependencies
  uv add <package-name>
  uv add --dev <dev-package-name>
  uv lock --upgrade

  # Running test suites and tools
  uv run pytest
  uv run ruff check .
  uv run ruff format .
  uv run mypy .
  ```
* **Lockfile Enforcement**:
  * Track `uv.lock` and `pyproject.toml` in version control for deterministic multi-platform resolution.

---

## 3. Go Ecosystem

* **Compiler & Toolchain**: Modern Go (Go 1.24+ standard library).
* **Code Formatting**: Native `gofmt` enforced on all staged `.go` files.
* **Static Analysis**: `go vet ./...` required before committing.
* **Concurrency & Race Detection**: Run tests with race instrumentation enabled:
  ```bash
  go test -race -v ./...
  ```
* **Dependency Hygiene**: Always run `go mod tidy` after dependency updates.

---

## 4. Pre-Commit Validation Gate Integration

Every repository's pre-commit validation gate (`.githooks/pre-commit`) must verify:
1. No sensitive credential leaks (`.env`, private keys, bearer tokens).
2. Appropriate modern package managers are invoked (`pnpm` for frontend/Node, `uv` for Python).
3. No foreign lockfiles (`package-lock.json` in a pnpm project) are committed.
