# backups_latest

## Endpoint

- URL: https://github-backup-script.onrender.com/api/backups/latest
- Method: GET
- Query Params: None
- Description: Most recent backup run

## Pagination

```json
"No pagination found"
```

## Full Response

```json
{
  "run": {
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
}
```
