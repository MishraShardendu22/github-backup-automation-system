# Documentation Index

Welcome to the GitHub Backup Automation System documentation. This folder contains comprehensive guides for developers, operators, and API users.

## Quick Navigation

### For API Users
- **[API_REFERENCE.md](./API_REFERENCE.md)** — Complete API documentation with all endpoints, query parameters, request/response examples, and data models
- **[POSTMAN_SETUP.md](./POSTMAN_SETUP.md)** — Guide to import and use Postman collections for testing the API
- **[GitHub-Backup-API.postman_collection.json](./GitHub-Backup-API.postman_collection.json)** — Postman collection (import this into Postman)
- **[GitHub-Backup-Environment.postman_environment.json](./GitHub-Backup-Environment.postman_environment.json)** — Postman environment configuration

### For Developers & Operators
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System architecture, components, and data flow
- **[../README.md](../README.md)** — Project overview, setup instructions, and key features
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** — Contribution guidelines

## Documentation Files

### API_REFERENCE.md
Complete reference for all REST API endpoints organized by category:
- Backups (list, get latest, get by ID)
- Dashboard & Metrics (stats, trends, time-series)
- Analytics (snapshots, history)
- Repositories (tracked repos)
- Logs (execution logs with filtering)
- WebSocket (real-time log streaming)
- Error Handling
- Data Models with full field documentation

**Use this when:** Building API integrations, understanding data structures, troubleshooting API issues

### POSTMAN_SETUP.md
Step-by-step guide for importing and using Postman for API testing:
- Quick start instructions
- Environment configuration
- Making test requests
- Advanced features (scripting, workflows)
- WebSocket connections
- Troubleshooting
- Response examples

**Use this when:** Setting up API testing in Postman, configuring environments, testing endpoints

### GitHub-Backup-API.postman_collection.json
Pre-configured Postman collection with all API endpoints:
- Organized by resource (Backups, Analytics, Metrics, etc.)
- Built-in test scripts for each endpoint
- Query parameters and headers pre-configured
- Sample responses documented

**Use this:** Import into Postman via `File → Import`

### GitHub-Backup-Environment.postman_environment.json
Pre-configured environment variables for Postman:
- `base_url` — HTTP API endpoint (default: `localhost:8080`)
- `base_url_ws` — WebSocket endpoint (default: `localhost:8080`)

**Use this:** Import into Postman for automatic variable configuration

### ARCHITECTURE.md
System design and technical architecture documentation covering:
- Component overview
- Database schema
- Worker flow and processing pipeline
- Backend services
- Data models and relationships

**Use this when:** Understanding the system design, contributing to core features

## Quick Start Checklist

### I want to use the API
1. ✅ Read [API_REFERENCE.md](./API_REFERENCE.md) for endpoint details
2. ✅ Set up Postman using [POSTMAN_SETUP.md](./POSTMAN_SETUP.md)
3. ✅ Import the [collection](./GitHub-Backup-API.postman_collection.json) and [environment](./GitHub-Backup-Environment.postman_environment.json)
4. ✅ Start making API calls!

### I want to contribute code
1. ✅ Read [../README.md](../README.md) for project overview
2. ✅ Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. ✅ Review [../CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines

### I want to deploy/operate the system
1. ✅ Read [../README.md](../README.md) for setup and configuration
2. ✅ Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for understanding components
3. ✅ Review environment variables in `sample.env`

## API Endpoints Summary

| Category | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| **Backups** | `/api/backups` | GET | List backup runs (paginated) |
| | `/api/backups/latest` | GET | Get most recent backup |
| | `/api/backups/:id` | GET | Get specific backup with results |
| **Dashboard** | `/api/dashboard/stats` | GET | Get dashboard statistics |
| **Metrics** | `/api/metrics` | GET | Get time-series metrics |
| **Analytics** | `/api/analytics/history` | GET | List all analytics snapshots |
| | `/api/analytics/latest` | GET | Get latest analytics |
| | `/api/analytics/:id` | GET | Get analytics for specific run |
| **Repos** | `/api/repos` | GET | List tracked repositories |
| **Logs** | `/api/logs` | GET | Get execution logs |
| **WebSocket** | `/ws/live` | WS | Real-time log streaming |

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Frontend (Next.js/React)                    │
│    Dashboard, Analytics, Real-time Logs             │
└────────────────────┬────────────────────────────────┘
                     │ HTTP + WebSocket
                     ▼
┌─────────────────────────────────────────────────────┐
│         Backend (Go + Fiber)                        │
│  REST API, WebSocket Server, Rate Limiting          │
└────────────┬──────────────────────┬─────────────────┘
             │                      │
             ▼                      ▼
       ┌──────────┐         ┌──────────────┐
       │PostgreSQL│         │   Worker     │
       │Database  │         │  (CLI/Cron)  │
       └──────────┘         └──────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
            ┌─────────────────┐        ┌─────────────────┐
            │GitHub API       │        │_Repos Git Repo  │
            │(List Repos)     │        │(Archive Storage)│
            └─────────────────┘        └─────────────────┘
```

## Key Concepts

**Backup Run** — Single execution of the backup worker that:
1. Fetches repository list from GitHub
2. Checks for changes using `git ls-remote`
3. Clones, archives, and commits changed repos
4. Records results in PostgreSQL

**Analytics Snapshot** — Statistical metadata about the backup repository:
- Commit history, branch/tag counts
- File and archive sizes
- Largest blobs/archives
- Captured at end of backup run

**Dashboard** — Web UI showing:
- Run history and statistics
- Success rates and trends
- Real-time logs via WebSocket
- Detailed backup results

## Configuration

All configuration is via environment variables. See:
- `sample.env` — Example environment variables
- [../README.md](../README.md) — Setup instructions

Key variables:
- `POSTGRES_URL` — PostgreSQL connection string
- `SERVER_PORT` — Backend server port (default: 8080)
- `GITHUB_TOKEN_PERSONAL` — GitHub API token
- `BACKUP_REPO_PATH` — Remote git URL for backup repo

## Support & Troubleshooting

### Common Issues

**API returns 500 error**
- Check PostgreSQL is running and accessible
- Verify `POSTGRES_URL` is correct
- Check backend logs for database errors

**WebSocket connection fails**
- Verify backend is listening on correct port
- Check firewall allows WebSocket connections
- Use `ws://` protocol, not `http://`

**Rate limiting (429 errors)**
- Reduce request frequency
- Implement exponential backoff
- Contact admin if limits are too restrictive

See [POSTMAN_SETUP.md](./POSTMAN_SETUP.md#troubleshooting) for more troubleshooting tips.

## Updates & Versions

- **Current Version**: 1.0.0
- **Last Updated**: June 2024
- **Backend Framework**: Go + Fiber v2
- **Database**: PostgreSQL
- **Frontend**: Next.js + React + TypeScript

## Contributing

Have suggestions or found issues? Please:
1. Check [../CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines
2. Review existing issues in the repository
3. Submit a PR with clear description of changes
