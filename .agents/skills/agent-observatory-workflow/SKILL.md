---
name: agent-observatory-workflow
description: >-
  Step-by-step instructions for building and extending Python AI agent services: adding LangChain/LiteLLM tools,
  Tool-Calling RAG workflows, enforcing Human-in-the-Loop approvals, multi-key model failover, and pgvector embeddings.
---

# Agent Observatory & Tool-Calling RAG Workflow Guide

This skill guides agents and engineers on how to build, extend, test, and enhance AI agent services utilizing Tool-Calling RAG, LangChain/LiteLLM architectures, and pgvector embeddings.

---

## 1. Local Branch-First Development

> [!IMPORTANT]
> **CREATE A LOCAL BRANCH FIRST**: Always start by creating a dedicated local branch from `main`:
> ```bash
> git switch -c <developer-or-agent>/main/<feature-name>
> ```
> Never develop or modify agent code directly on `main`.

---

## 2. Adding a New Agent Tool

1. Create or update a tool file under your agent tools directory (e.g. `agent/tools/` or `data/tools/`):
   ```python
   from typing import Annotated, Any
   from langchain_core.tools import tool

   @tool
   async def inspect_custom_metric(
       metric_name: Annotated[str, "The name of the metric to query"],
       days: Annotated[int, "Number of lookback days"] = 7,
   ) -> dict[str, Any]:
       """Query operational metrics from the database or external API."""
       # Perform database query or API call
       return {"metric": metric_name, "value": 42}
   ```
2. Export the tool in the tools package `__init__.py`.
3. Register the tool in your central agent runner's `TOOLS` list.

---

## 3. Tool-Calling RAG & Vector Knowledge Base

The AI service operates as a **Tool-Calling RAG Agent**:
1. **Pre-turn Retrieval**: Injects top relevance chunks into system context before iteration 1.
2. **Dynamic Tool Calling**: The agent calls `hybrid_search_knowledge_base` during reasoning loops for deep evidence gathering:
   ```python
   from agent.tools import hybrid_search_knowledge_base
   ```
   * Supported source filters: `['chat_message', 'execution_log', 'investigation', 'task_result', 'incident_fix']`.
   * Combines Full-Text Search (tsvector), pgvector cosine similarity, and Reciprocal Rank Fusion (RRF).

---

## 4. Implementing Human-In-The-Loop (HITL) Actions

For sensitive or destructive actions (e.g., dispatching external emails, modifying records, triggering external deployments):
1. In the agent reasoning execution loop, intercept the tool call prior to execution:
   ```python
   if tool_name in SENSITIVE_ACTION_TOOLS:
       confirm_id = str(uuid.uuid4())
       confirm_event = asyncio.Event()
       active_confirmations[confirm_id] = confirm_event

       yield json.dumps({
           "type": "confirm_required",
           "confirm_id": confirm_id,
           "name": tool_name,
           "args": tool_args,
       })
       # Await user confirmation or timeout
       await asyncio.wait_for(confirm_event.wait(), timeout=120.0)
   ```
2. Feed the user approval or rejection payload back to the LLM context to continue execution safely.

---

## 5. Multi-Key API Failover

When interacting with external LLM APIs (e.g. OpenRouter, OpenAI, Anthropic):
- Maintain an in-memory pool of configured API keys.
- On HTTP `401`, `402`, or `429` (rate limit/quota exhaustion), rotate to the next backup key with exponential backoff and jitter.
- Track latency and failure counts per key to optimize routing.

---

## 6. Comprehensive Agent Test Suites

Execute verification test suites:
```bash
# 1. Run all unit and integration tests across the system
make test

# 2. Run dedicated AI Agent & Tool-Calling RAG test suite
make test-agents

# 3. Direct execution of agent evaluation tests
uv run python -m unittest discover -s tests -p "test_agent*.py"
```
