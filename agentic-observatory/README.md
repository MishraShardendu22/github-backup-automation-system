# Backup Observatory - Agentic Layer

The Agentic Observatory provides an AI-driven layer over the GitHub Backup Observatory data. It uses FastAPI for serving API requests and interfaces with OpenRouter for agentic intelligence.

## Tech Stack

- **Language**: Python 3
- **Framework**: FastAPI / Uvicorn
- **Package Manager**: `uv`
- **AI Integration**: OpenRouter

## Getting Started

### Prerequisites

- Python 3 installed
- `uv` installed (Python package installer and resolver)

### Installation

Navigate to the `agentic-observatory` directory and sync dependencies using `uv`. This will automatically create a virtual environment (`.venv`) and install the required packages defined in `pyproject.toml`.

```bash
cd agentic-observatory
uv sync
```

### Running Locally

To run the application, you can use `uv run` to start the Uvicorn server with hot-reload enabled:

```bash
uv run uvicorn main:app --reload
```

*Alternative*: You can also run the server by directly executing the `main.py` file, which Programmatically starts Uvicorn:

```bash
uv run python main.py
```

## Architecture and Import Conventions

This project strictly adheres to clear Python package layout and import conventions to ensure maintainability and a clean architecture akin to Go's package exports.

### Directory Structure

```text
- main.py             # Entry point
- agent/              # AI Agents and prompts (e.g., openrouter.py, prompts.py)
- clients/            # External clients (e.g., go_backend.py)
- config/             # Application configuration (settings.py)
- data/               # Data access and core logic
  - tools/            # Specific logic tools (analytics.py, backup.py, log.py, repository.py)
- utils/              # Shared utilities (logging.py, response.py)
```

### Key Import Rules

1. **Package Entrypoints**: Each module uses an `__init__.py` file to explicitly define public exports.
2. **Short, Clean Names**: Modules use short names (e.g., `openrouter.py`, `analytics.py`) instead of redundant suffixes like `*.agent.py`.
3. **Relative Imports**: Use explicit relative imports within packages (e.g., `from .prompts import SYSTEM_PROMPT` inside `agent/openrouter.py`).
4. **Internal vs Public**: Functions prefixed with a single underscore (e.g., `_internal_helper()`) are treated as internal, while unprefixed functions are public APIs.

## Centralized Logging

- The project uses a centralized logger defined in `utils/logging.py`.
- Import the logger with `from utils.logging import logger`.
- Avoid using `print()`. Instead, use `logger.info()`, `logger.debug()`, `logger.warning()`, or `logger.error()` as appropriate.

To quickly test logging:
```bash
.venv/bin/python -c "from utils.logging import logger; logger.info('logger works')"
```