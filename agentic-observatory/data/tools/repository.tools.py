from data.fetch import client
from typing import Annotated, Any
from langchain_core.tools import tool


@tool
async def list_repositories(
    page: Annotated[int, "Page number"] = 1,
    limit: Annotated[int, "Results per page"] = 50,
) -> dict[str, Any]:
    """List tracked repositories."""
    return await client.list_repos(page, limit)