from data.fetch import client
from typing import Annotated, Any
from langchain_core.tools import tool

@tool
async def dashboard_stats() -> dict[str, Any]:
    """Get aggregated dashboard statistics."""
    return await client.get_dashboard_stats()


@tool
async def list_backups(
    page: Annotated[int, "Page number"] = 1,
    limit: Annotated[int, "Results per page"] = 50,
) -> dict[str, Any]:
    """List backup runs."""
    return await client.list_backups(page, limit)


@tool
async def latest_backup() -> dict[str, Any]:
    """Get latest backup run."""
    return await client.get_latest_backup()


@tool
async def backup_details(
    backup_id: Annotated[int, "Backup run identifier"],
) -> dict[str, Any]:
    """Get backup details."""
    return await client.get_backup_details(backup_id)