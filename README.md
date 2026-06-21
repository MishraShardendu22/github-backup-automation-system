# GitHub Backup Observatory

## Overview

The GitHub Backup Observatory is a compact, multi-service architecture designed to clone, archive, and consolidate GitHub repositories into a singular, unified backup repository. Built for reliability and observability, the system integrates a Go-based CLI worker, a Go and PostgreSQL-powered REST API and WebSocket backend, a Next.js frontend dashboard for real-time monitoring, and an AI-driven Agentic Observatory.

## Live Resources

- **Live Dashboard**: [github.mishrashardendu22.is-a.dev](https://github.mishrashardendu22.is-a.dev)
- **Video Demonstration**: [YouTube](https://www.youtube.com/watch?v=be0UBwk2asc)

## Architecture Overview

This repository operates as a monorepo containing the following core services:

1. **Worker (CLI)**: The root-level Go application responsible for the core logic. It traverses target GitHub accounts, deduplicates repositories, verifies remote HEAD hashes, executes shallow clones, and archives the repositories to a centralized `_Repos` Git repository.
2. **Backend API (`backend/`)**: A Go-based web server integrated with PostgreSQL. It serves operational metrics, historical run data, and real-time logs via REST APIs and WebSockets.
3. **Frontend Dashboard (`frontend/`)**: A Next.js application providing a comprehensive, real-time user interface for monitoring backup executions, performance metrics, and system logs.
4. **Agentic Observatory (`agentic-observatory/`)**: A Python-based agentic layer utilizing FastAPI and OpenRouter to autonomously analyze and interact with the backup data.

## Core Engine: Worker (CLI)

The primary backup engine resides in the root directory. It leverages a lightweight SQLite database for local state management and metadata tracking.

### Operational Phases

- **Phase 1: Hash Verification**: Concurrently computes the remote HEAD to determine if repository changes have occurred since the last backup.
- **Phase 2: Clone and Archive**: Performs shallow clones of modified repositories, removes `.git` directories to prevent nested repository issues, and generates `tar.gz` archives.
- **Phase 3: Commit and Push**: Commits the generated archives to the central `_Repos` Git repository and pushes the updates to the remote origin.

### Configuration

Environment variables must be configured prior to execution. Create a `.env` file in the root directory based on the provided `sample.env`:

- `ORG_ACCOUNT` / `PROJECT_ACCOUNT`: Target GitHub accounts for the backup process.
- `DB_PATH`: Absolute or relative path for the SQLite database file (defaults to `./app.db`).
- `BACKUP_REPO_PATH`: The remote Git URL for the centralized `_Repos` directory.
- `GITHUB_TOKEN_PRIVATE` / `GITHUB_TOKEN_PERSONAL`: Authentication tokens for GitHub API access.

### Execution

Ensure the Go toolchain, `git`, and `tar` are installed on the host system.

```bash
# Configure .env or export environment variables
go run main.go
```

## Service Documentation

For detailed instructions concerning the deployment, configuration, and development of individual services, refer to their respective documentation:

- **[Backend Documentation](./backend/README.md)**
- **[Frontend Documentation](./frontend/README.md)**
- **[Agentic Observatory Documentation](./agentic-observatory/README.md)**

## Contributing

Contributors are expected to adhere to the established coding conventions. Refer to `CONTRIBUTING.md` for guidelines on submitting improvements and modifications.