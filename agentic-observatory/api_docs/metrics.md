# metrics

## Endpoint

- URL: https://github-backup-script.onrender.com/api/metrics?days=30&page=1&limit=50
- Method: GET
- Query Params: days=30, page=1, limit=50
- Description: Metrics and trends

## Pagination

```json
"No pagination found"
```

## Full Response

```json
{
  "avg_duration_ms": 786956,
  "distinct_repos": 162,
  "largest_archive_bytes": 76476397,
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
  "runs": [
    {
      "started_at": "2026-06-17T08:39:14.639076Z",
      "status": "completed",
      "error_message": "",
      "duration_ms": 2205410,
      "completed_at": "2026-06-17T09:15:59.524293Z",
      "id": 1,
      "total_repos": 162,
      "successful": 162,
      "failed": 0,
      "skipped": 0
    },
    {
      "started_at": "2026-06-17T09:57:57.321381Z",
      "status": "completed",
      "error_message": "",
      "duration_ms": 89630,
      "completed_at": "2026-06-17T09:59:26.536503Z",
      "id": 2,
      "total_repos": 162,
      "successful": 2,
      "failed": 0,
      "skipped": 160
    },
    {
      "started_at": "2026-06-17T10:54:36.09821Z",
      "status": "completed",
      "error_message": "",
      "duration_ms": 65828,
      "completed_at": "2026-06-17T10:55:41.660335Z",
      "id": 3,
      "total_repos": 162,
      "successful": 2,
      "failed": 0,
      "skipped": 160
    }
  ],
  "total_failed": 0,
  "total_logs": 172,
  "total_runs": 3,
  "total_size_bytes": 819357623,
  "total_skipped": 320,
  "total_successful": 166
}
```
