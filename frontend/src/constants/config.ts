export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

export const LOADING_MESSAGES = [
  "🔒 Connecting securely to database pool...",
  "⚙️ Fetching backup execution details...",
  "📊 Aggregating repository telemetry logs...",
  "🧬 Analyzing system health signals...",
  "🔋 Syncing historical report archives...",
];
