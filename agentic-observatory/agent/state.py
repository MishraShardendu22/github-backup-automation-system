from typing import Any
from typing_extensions import TypedDict


class AgentState(TypedDict):
    answer: str
    question: str
    request_id: str

    messages: list[Any]

    tool_calls: list[dict]
    tool_results: list[dict]