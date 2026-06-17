import json
import time
from typing import AsyncIterator
from uuid import uuid4
from data.tools import (
    list_backup_runs,
    list_execution_logs,
    fetch_backup_metrics,
    fetch_latest_backup_run,
    fetch_analytics_for_run,
    fetch_backup_run_details,
    list_historical_analytics,
    list_tracked_repositories,
    fetch_dashboard_statistics,
    fetch_latest_analytics_snapshot,
)
from config import settings
from pydantic import BaseModel
from utils.logging import logger
from .prompts import SYSTEM_PROMPT
from langchain_core.messages import (
    ToolMessage,
    HumanMessage,
    SystemMessage,
)
from langchain_openrouter import ChatOpenRouter

class ToolExecution(BaseModel):
    name: str
    args: dict
    success: bool
    duration_ms: float
    error: str | None = None


class AgentResponse(BaseModel):
    request_id: str
    answer: str
    tool_calls: list[ToolExecution]


TOOLS = [
    list_backup_runs,
    list_execution_logs,
    fetch_backup_metrics,
    fetch_latest_backup_run,
    fetch_analytics_for_run,
    fetch_backup_run_details,
    list_historical_analytics,
    list_tracked_repositories,
    fetch_dashboard_statistics,
    fetch_latest_analytics_snapshot,
]

TOOLS_BY_NAME = {
    tool.name: tool
    for tool in TOOLS
}

# Initialize the LLM
def get_llm() -> ChatOpenRouter:
    return ChatOpenRouter(
        temperature=0.2,
        model=settings.OPENROUTER_MODEL,
        api_key=settings.OPENROUTER_API_KEY,
    )

# Bind tools to the LLM, so that it can call them when needed
def get_bound_llm():
    return get_llm().bind_tools(
        TOOLS,
        strict=True,
    )

# Serialize tool results to a string, ensuring it doesn't exceed token limits
def serialize_tool_result(data) -> str:
    content = json.dumps(data)

    if len(content) > 15000:
        content = content[:15000]

    return content

# Main function to invoke the agent with a user question, 
# handle tool calls, and return the final answer
async def invoke_agent(question: str) -> AgentResponse:
    request_id = str(uuid4())
    start = time.perf_counter()
    llm = get_bound_llm()

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=question),
    ]

    logger.info(f"[request_id={request_id}] Agent question: {question}")

    # First LLM call
    response = await llm.ainvoke(messages)

    logger.info(f"[request_id={request_id}] === TOOL CALLS ===")
    logger.info(f"[request_id={request_id}] Tool calls: {response.tool_calls}")

    # No tools needed directly return the content
    if not response.tool_calls:
        duration = time.perf_counter() - start
        logger.info(f"[request_id={request_id}] Agent completed in {duration:.2f}s")

        return AgentResponse(
            request_id=request_id,
            answer=response.content,
            tool_calls=[],
        )

    # Add AI message containing tool requests
    messages.append(response)
    executed_tools: list[ToolExecution] = []

    # Execute every requested tool
    for tool_call in response.tool_calls:
        tool_args = tool_call["args"]
        tool_name = tool_call["name"]

        logger.debug(f"[request_id={request_id}] Tool args: {tool_args}")
        logger.info(f"[request_id={request_id}] Executing tool: {tool_name}")

        tool_start = time.perf_counter()
        try:
            tool = TOOLS_BY_NAME[tool_name]
            tool_result = await tool.ainvoke(tool_args)
            tool_duration_ms = (time.perf_counter() - tool_start) * 1000
            executed_tools.append(
                ToolExecution(
                    name=tool_name,
                    args=tool_args,
                    success=True,
                    duration_ms=tool_duration_ms,
                )
            )

            messages.append(
                ToolMessage(
                    content=serialize_tool_result(tool_result),
                    tool_call_id=tool_call["id"],
                )
            )

            logger.info(f"[request_id={request_id}] Tool success: {tool_name} ({tool_duration_ms:.2f}ms)")

        except Exception as e:
            tool_duration_ms = (time.perf_counter() - tool_start) * 1000
            executed_tools.append(
                ToolExecution(
                    name=tool_name,
                    args=tool_args,
                    success=False,
                    duration_ms=tool_duration_ms,
                    error=str(e),
                )
            )

            messages.append(
                ToolMessage(
                    content=f"Tool execution failed: {str(e)}",
                    tool_call_id=tool_call["id"],
                )
            )

            logger.error(f"[request_id={request_id}] Tool failed: {tool_name} ({tool_duration_ms:.2f}ms) error={str(e)}")

    # Second LLM call with tool results
    final_response = await llm.ainvoke(messages)

    # Calculate total duration and return the final answer along with tool call details
    duration = time.perf_counter() - start
    logger.info(f"[request_id={request_id}] Agent completed in {duration:.2f}s")

    return AgentResponse(
        request_id=request_id,
        tool_calls=executed_tools,
        answer=final_response.content,
    )


def extract_text_from_chunk(chunk) -> str:
    content = getattr(chunk, "content", None)

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, dict):
                text_parts.append(item.get("text", "") or item.get("content", ""))
        return "".join(text_parts)

    if hasattr(chunk, "content_blocks"):
        text_parts = []
        for block in getattr(chunk, "content_blocks", []) or []:
            if isinstance(block, str):
                text_parts.append(block)
            elif hasattr(block, "text"):
                text_parts.append(getattr(block, "text", ""))
            elif isinstance(block, dict):
                text_parts.append(block.get("text", "") or block.get("content", ""))
        return "".join(text_parts)

    return ""


async def _stream_final_answer(llm, messages, request_id: str, start: float) -> AsyncIterator[str]:
    async for chunk in llm.astream(messages):
        token = extract_text_from_chunk(chunk)
        if token:
            yield token

    duration = time.perf_counter() - start
    logger.info(f"[request_id={request_id}] Streamed final answer in {duration:.2f}s")


async def stream_agent(question: str) -> AsyncIterator[str]:
    request_id = str(uuid4())
    start = time.perf_counter()
    llm = get_bound_llm()

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=question),
    ]

    logger.info(f"[request_id={request_id}] Agent question: {question}")

    # First LLM call
    response = await llm.ainvoke(messages)

    logger.info(f"[request_id={request_id}] === TOOL CALLS ===")
    logger.info(f"[request_id={request_id}] Tool calls: {response.tool_calls}")

    # No tools needed directly stream the final content
    if not response.tool_calls:
        if response.content:
            yield response.content
        return

    # Add AI message containing tool requests
    messages.append(response)
    executed_tools: list[ToolExecution] = []

    # Execute every requested tool
    for tool_call in response.tool_calls:
        tool_args = tool_call["args"]
        tool_name = tool_call["name"]

        logger.debug(f"[request_id={request_id}] Tool args: {tool_args}")
        logger.info(f"[request_id={request_id}] Executing tool: {tool_name}")

        tool_start = time.perf_counter()
        try:
            tool = TOOLS_BY_NAME[tool_name]
            tool_result = await tool.ainvoke(tool_args)
            tool_duration_ms = (time.perf_counter() - tool_start) * 1000
            executed_tools.append(
                ToolExecution(
                    name=tool_name,
                    args=tool_args,
                    success=True,
                    duration_ms=tool_duration_ms,
                )
            )

            messages.append(
                ToolMessage(
                    content=serialize_tool_result(tool_result),
                    tool_call_id=tool_call["id"],
                )
            )

            logger.info(f"[request_id={request_id}] Tool success: {tool_name} ({tool_duration_ms:.2f}ms)")
        except Exception as e:
            tool_duration_ms = (time.perf_counter() - tool_start) * 1000
            executed_tools.append(
                ToolExecution(
                    name=tool_name,
                    args=tool_args,
                    success=False,
                    duration_ms=tool_duration_ms,
                    error=str(e),
                )
            )

            messages.append(
                ToolMessage(
                    content=f"Tool execution failed: {str(e)}",
                    tool_call_id=tool_call["id"],
                )
            )

            logger.error(f"[request_id={request_id}] Tool failed: {tool_name} ({tool_duration_ms:.2f}ms) error={str(e)}")

    async for token in _stream_final_answer(llm, messages, request_id, start):
        yield token
