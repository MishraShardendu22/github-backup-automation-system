from data.fetch import client
from typing import Annotated, Any
from langchain_core.tools import tool


@tool
async def metrics(
    days: Annotated[int, "Days to analyze"] = 30,
    page: Annotated[int, "Page number"] = 1,
    limit: Annotated[int, "Results per page"] = 50,
) -> dict[str, Any]:
    """Get backup metrics."""
    return await client.get_metrics(days, page, limit)


@tool
async def analytics_history(
    page: Annotated[int, "Page number"] = 1,
    limit: Annotated[int, "Results per page"] = 50,
) -> dict[str, Any]:
    """List analytics snapshots."""
    return await client.list_analytics_history(page, limit)


@tool
async def latest_analytics() -> dict[str, Any]:
    """Get latest analytics snapshot."""
    return await client.get_latest_analytics()


@tool
async def analytics_for_run(
    run_id: Annotated[int, "Backup run identifier"],
) -> dict[str, Any]:
    """Get analytics for a specific run."""
    return await client.get_analytics_for_run(run_id)