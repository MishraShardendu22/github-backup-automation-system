# backups

## Endpoint

- URL: https://github-backup-script.onrender.com/api/backups?page=1&limit=50
- Method: GET
- Query Params: page=1, limit=50
- Description: Paginated backup runs

## Pagination

```json
{
  "page": 1,
  "limit": 50,
  "total_items": 3,
  "total_pages": 1
}
```

## Full Response

```json
{
  "data": [
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
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_items": 3,
    "total_pages": 1
  }
}
```
