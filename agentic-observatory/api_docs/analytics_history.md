# analytics_history

## Endpoint

- URL: https://github-backup-script.onrender.com/api/analytics/history?page=1&limit=50
- Method: GET
- Query Params: page=1, limit=50
- Description: Analytics history

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
    {
      "captured_at": "2026-06-17T09:59:27.749623Z",
      "head_commit": "42e7729c7ba3a91262f08c9591e7df6601c41963",
      "head_commit_message": "Backup Added on 2026-06-17 Wednesday 15:29:20 for the repo redis-leaderboard",
      "largest_archive_path": "Boxit.tar.gz",
      "largest_blob_path": "Boxit.tar.gz",
      "total_blob_size_bytes": 768753144,
      "avg_blob_size_bytes": 4927904,
      "largest_blob_size_bytes": 76476397,
      "total_archive_size_bytes": 768753144,
      "largest_archive_size_bytes": 76476397,
      "avg_archive_size_bytes": 4927904,
      "head_commit_at": "2026-06-17T09:59:21Z",
      "run_id": 2,
      "id": 2,
      "total_commits": 165,
      "branch_count": 1,
      "tag_count": 0,
      "tracked_files": 156,
      "archive_count": 156
    },
    {
      "captured_at": "2026-06-17T09:16:00.323965Z",
      "head_commit": "",
      "head_commit_message": "",
      "largest_archive_path": "Boxit.tar.gz",
      "largest_blob_path": "Boxit.tar.gz",
      "total_blob_size_bytes": 768752348,
      "avg_blob_size_bytes": 4927899,
      "largest_blob_size_bytes": 76476397,
      "total_archive_size_bytes": 768752348,
      "largest_archive_size_bytes": 76476397,
      "avg_archive_size_bytes": 4927899,
      "head_commit_at": null,
      "run_id": 1,
      "id": 1,
      "total_commits": 0,
      "branch_count": 0,
      "tag_count": 0,
      "tracked_files": 156,
      "archive_count": 156
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
