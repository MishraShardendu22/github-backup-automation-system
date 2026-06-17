# dashboard_stats

## Endpoint

- URL: https://github-backup-script.onrender.com/api/dashboard/stats
- Method: GET
- Query Params: None
- Description: Dashboard statistics

## Pagination

```json
"No pagination found"
```

## Full Response

```json
{
  "last_run_status": "completed",
  "largest_repository": "MishraShardendu22/Boxit",
  "latest_analytics": {
    "captured_at": "2026-06-17T10:55:42.181589Z",
    "head_commit": "09d36e8415f8ddf1f25c51401143d840328e1d2a",
    "head_commit_message": "Backup Added on 2026-06-17 Wednesday 16:25:38 for the repo redis-leaderboard",
    "largest_archive_path": "Boxit.tar.gz",
    "largest_blob_path": "Boxit.tar.gz",
    "total_blob_size_bytes": 768772618,
    "avg_blob_size_bytes": 4928029,
    "largest_blob_size_bytes": 76476397,
    "total_archive_size_bytes": 768772618,
    "largest_archive_size_bytes": 76476397,
    "avg_archive_size_bytes": 4928029,
    "head_commit_at": "2026-06-17T10:55:38Z",
    "run_id": 3,
    "id": 3,
    "total_commits": 167,
    "branch_count": 1,
    "tag_count": 0,
    "tracked_files": 156,
    "archive_count": 156
  },
  "last_run_at": "2026-06-17T10:54:36.09821Z",
  "avg_duration_ms": 786956,
  "total_size_bytes": 819357623,
  "largest_archive_bytes": 76476397,
  "success_rate": 100,
  "total_failed": 0,
  "total_runs": 3,
  "total_repos": 486,
  "total_successful": 166,
  "total_skipped": 320,
  "distinct_repos": 162,
  "total_logs": 172
}
```
