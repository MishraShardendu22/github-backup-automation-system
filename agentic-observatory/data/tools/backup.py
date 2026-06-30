from data import client
from typing import Annotated, Any
from langchain_core.tools import tool

@tool
async def fetch_dashboard_statistics() -> dict[str, Any]:
    """Fetch aggregated dashboard statistics for the backup system.

    Use when asking for high-level summary metrics or current dashboard overview.
    Examples:
    - "Show dashboard statistics for backup success and failures."
    - "What is the current backup dashboard summary?"
    - "Get overall backup system health metrics."
    - "Retrieve aggregated dashboard stats."
    - "Summarize the backup dashboard values."
    """
    return await client.get_dashboard_stats()


@tool
async def list_backup_runs(
    page: Annotated[int, "Page number"] = 1,
    limit: Annotated[int, "Results per page"] = 50,
) -> dict[str, Any]:
    """List backup runs with pagination.

    Use when requesting backup run history, recent runs, or a list of backups.
    Examples:
    - "List recent backup runs."
    - "Show backup history for the last 50 runs."
    - "Retrieve paginated backup runs."
    - "What backups have completed recently?"
    - "Display backup run history."
    """
    return await client.list_backups(page, limit)


@tool
async def fetch_latest_backup_run() -> dict[str, Any]:
    """Fetch the most recent backup run details.

    Use when asking for the latest backup execution, status, or results.
    Examples:
    - "Get the latest backup run."
    - "What was the most recent backup status?"
    - "Fetch details for the newest backup."
    - "Show the current latest backup result."
    - "Retrieve the latest backup execution details."
    """
    return await client.get_latest_backup()


@tool
async def fetch_backup_run_details(
    backup_id: Annotated[int, "Backup run identifier"],
) -> dict[str, Any]:
    """Fetch detailed information for a specific backup run.

    Use when asking about the status, duration, or outcome of one backup run.
    Examples:
    - "Get backup details for run 12."
    - "Show the outcome of backup run 202."
    - "Retrieve execution details for this backup ID."
    - "What happened during backup run 9?"
    - "Fetch the specific backup run diagnostics."
    """
    return await client.get_backup_details(backup_id)


@tool
async def list_backup_fixes() -> list[dict[str, Any]]:
    """List all resolutions/fixes registered in the system.

    Use when requesting a list of all fixes, solutions, or resolution history.
    Examples:
    - "What fixes have been created in the system?"
    - "Show the resolutions list."
    - "List all backup fixes."
    - "Retrieve a list of all resolution actions."
    """
    return await client.list_backup_fixes()


@tool
async def fetch_backup_fix_details(
    fix_id: Annotated[int, "Fix/resolution identifier"],
) -> dict[str, Any]:
    """Fetch details of a specific resolution/fix by its identifier.

    Use when asking about a particular fix, its description, author, commit hash, or affected runs.
    Examples:
    - "Get details for fix number 3."
    - "Show the resolution description for fix 5."
    - "What runs were affected by fix 2?"
    - "Who authored fix 1?"
    """
    return await client.get_backup_fix_details(fix_id)