---
name: agentic-observatory-workflow
scope: codebase-github-backup-automation-system
description: >-
  Specific procedures for developing, extending, and testing the Python AI Observatory service in github-backup-automation-system (tools, pgvector, HITL, OpenRouter pool).
---

# Agentic Observatory Service Workflow

> [!IMPORTANT]
> **CODEBASE-SPECIFIC SCOPE**: This skill is strictly specific to the **GitHub Backup Automation System** (`github-backup-automation-system`). It guides agents on modifying and extending `agentic-observatory/`.

---

## 1. Adding a Tool to the Observatory Agent

1. Implement the tool in `agentic-observatory/data/tools/`:
   ```python
   from typing import Annotated, Any
   from langchain_core.tools import tool

   @tool
   async def inspect_backup_metric(
       metric_name: Annotated[str, "Name of the operational metric"],
       limit: Annotated[int, "Number of data points"] = 10,
   ) -> dict[str, Any]:
       """Query operational metrics from the PostgreSQL database."""
       return {"metric": metric_name, "count": limit}
   ```
2. Export the tool in `agentic-observatory/data/tools/__init__.py`.
3. Register the tool in `TOOLS` within `agentic-observatory/agent/openrouter.py`.

---

## 2. Tool-Calling RAG & Knowledge Base Search

The Observatory agent calls `hybrid_search_knowledge_base` during reasoning loops:
- **Source Filters**: `['chat_message', 'execution_log', 'investigation', 'backup_result', 'backup_fix']`.
- **Hybrid Algorithm**: PostgreSQL Full-Text Search (`tsvector`) + pgvector cosine similarity + Reciprocal Rank Fusion (RRF).

---

## 3. Human-In-The-Loop (HITL) Confirmations

Sensitive actions (e.g. `send_report_email`) require asynchronous user confirmation:
1. Intercept in `agentic-observatory/agent/openrouter.py`:
   ```python
   if tool_name == "send_report_email":
       confirm_id = str(uuid.uuid4())
       confirm_event = asyncio.Event()
       active_confirmations[confirm_id] = confirm_event

       yield json.dumps({
           "type": "confirm_required",
           "confirm_id": confirm_id,
           "name": tool_name,
           "args": tool_args,
       })
       await asyncio.wait_for(confirm_event.wait(), timeout=120.0)
   ```
2. Handle the user confirmation webhook via `/chat/confirm`.

---

## 4. Multi-Key OpenRouter Failover

Centralized in `agentic-observatory/utils/openrouter_keys.py`:
- `get_openrouter_api_keys()`: Reads comma-separated keys from environment.
- `get_active_openrouter_key()`: Returns active client key.
- `rotate_openrouter_key(failed_key, reason)`: Rotates to the next pool key on `401`, `402`, or `429` status codes.

---

## 5. Verification & Test Suite

```bash
# Run AI Agent & Tool-Calling RAG test suite
make test-agents

# Run individual test modules
cd agentic-observatory && uv run python -m unittest test_observability.py test_openrouter_keys.py test_agent_suite.py
```
