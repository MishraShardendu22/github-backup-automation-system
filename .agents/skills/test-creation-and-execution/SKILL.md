---
name: test-creation-and-execution
description: >-
  Rules, patterns, and runbooks for writing and running unit, integration, and AI agent test suites
  across Go, Python, and TypeScript frontends.
---

# Test Creation & Execution Skill

This skill defines the testing standards, frameworks, conventions, and execution workflows for polyglot services and applications.

---

## 1. Local Branch-First Development

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST**: Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Never write tests or code directly on `main`.

---

## 2. Testing Architecture & Frameworks

| Subsystem | Typical Location | Framework & Tooling | Primary Test Command |
| :--- | :--- | :--- | :--- |
| **Go Backend & Workers** | `backend/`, `api/`, `cmd/` | Standard Go `testing`, `httptest` | `go test -v -race ./...` |
| **Python Services** | `ai-service/`, `agent/` | Python `unittest` / `pytest`, `unittest.mock`, `httpx` | `uv run pytest` |
| **AI Agent & RAG** | `agent/`, `evals/` | Tool-calling mocks, evaluation harness | `make test-agents` |
| **Frontend & Web** | `frontend/`, `web/` | Vitest, TypeScript `tsc` | `pnpm exec vitest run` |

---

## 3. Go Test Creation Standards

### File Naming & Package Placement
- Test files MUST reside in the same package and end with `_test.go` (e.g. `handlers/health_test.go`).
- Package declarations match the production package (e.g. `package handlers` or `package handlers_test` for black-box testing).

### Table-Driven Tests Pattern
Always prefer table-driven testing in Go:

```go
package config_test

import (
	"testing"
)

func TestConfigValidation(t *testing.T) {
	tests := []struct {
		name    string
		envMap  map[string]string
		wantErr bool
	}{
		{
			name: "valid configuration",
			envMap: map[string]string{
				"DATABASE_URL": "postgres://user:pass@localhost:5432/db",
			},
			wantErr: false,
		},
		{
			name:    "missing required database url",
			envMap:  map[string]string{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set environment, run validation, and assert
		})
	}
}
```

---

## 4. Python Test Creation Standards

### File Placement & Naming
- Tests reside in `tests/` with prefix `test_*.py`.

### Mocking External APIs
- Never perform live external network or LLM API calls during automated unit tests.
- Use `unittest.mock.patch` or `pytest-mock` to mock `httpx.AsyncClient` or external model clients:

```python
import unittest
from unittest.mock import AsyncMock, patch

class TestHealthAPI(unittest.IsolatedAsyncioTestCase):
    async def test_health_check(self):
        # Test mock client
        pass
```

---

## 5. Test Execution Runbook

```bash
# 1. Run all test suites across the repository
make test

# 2. Run Go tests with race detection
go test -v -race ./...

# 3. Run Python test suite
uv run pytest

# 4. Run Frontend test suite
pnpm run test
```
