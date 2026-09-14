---
name: saas-and-mcp-architecture
description: >-
  Architectural patterns and implementation guidelines for SaaS connector hubs,
  pluggable multi-cloud storage engines, and Model Context Protocol (MCP) tool integrations.
---

# SaaS Connector & Autonomous MCP Architecture Skill

This skill guides AI agents in implementing and extending enterprise SaaS capabilities, encrypted credential vaults, multi-cloud storage backends, and Model Context Protocol (MCP) server integrations across applications.

---

## 1. UI Connector Hub & Encrypted Credential Vault

When implementing or modifying connectors:

- **Zero Plaintext Secrets in Client-Side Storage**: User-provided API keys and third-party tokens MUST be stored in the database with AES-256-GCM envelope encryption.
- **Provider Connection Pooling**: Support multiple API keys with round-robin rotation, latency tracking, and automatic failover.
- **Database Connectors**: Provide connection validation and branch selection for serverless and self-hosted PostgreSQL instances.
- **Health Probes**: Connectors must implement a periodic health check loop (`last_health_check`, `health_status`).

---

## 2. Pluggable Multi-Cloud Storage Engine

When extending file archiving and storage destinations:

- All storage drivers must implement a standard `StorageProvider` interface:
  ```go
  type StorageProvider interface {
      Upload(ctx context.Context, key string, r io.Reader, size int64) error
      Download(ctx context.Context, key string, w io.Writer) error
      VerifyChecksum(ctx context.Context, key string, expectedSHA256 string) (bool, error)
      Delete(ctx context.Context, key string) error
      List(ctx context.Context, prefix string) ([]ObjectMetadata, error)
  }
  ```
- Support pluggable backends: AWS S3, Cloudflare R2, MinIO, Google Drive, Azure Blob, and Local Filesystem.
- Streaming uploads should stream directly from memory or pipes without requiring massive local scratch disk space.

---

## 3. Model Context Protocol (MCP) Server Integration

When adding MCP tools to AI agents:

1. **Protocol Adherence**: Connect via standard MCP JSON-RPC protocol over Stdio or Server-Sent Events (SSE).
2. **Human-In-The-Loop (HITL) Enforcement**:
   - Read-only tools (`query_state`, `list_records`, `inspect_telemetry`) execute automatically.
   - Destructive or external actions (`restart_service`, `restore_snapshot`, `trigger_incident_alert`, `apply_schema_migration`) MUST trigger the HITL confirmation protocol.
3. **Structured Response Synthesis**:
   - All MCP tool outputs must be synthesized concisely in structured Markdown without emojis or conversational filler.

---

## 4. Exposing Native MCP Servers

When exposing a service's functionality as an MCP server to external IDEs or agents:

- Implement core tools:
  - `get_system_health`: Real-time status of services, DB, and queues.
  - `trigger_job`: Autonomous execution of specified jobs or workflows.
  - `search_knowledge_base`: Hybrid pgvector search across system logs.
  - `verify_data_integrity`: Checksum and schema validation.
- Support both standard stdio transport for local CLI/IDE agents and HTTP/SSE transport for web-based agents.
