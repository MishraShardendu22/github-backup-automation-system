import Link from "next/link";
import type { BackupResult, BackupRun } from "@/lib/types";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchRunDetail(
  id: string,
): Promise<{ run: BackupRun; results: BackupResult[] } | null> {
  try {
    const res = await fetch(`${API}/api/backups/${id}`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export default async function BackupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchRunDetail(id);

  if (!data) {
    return (
      <div style={{ textAlign: "center", paddingTop: 100 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28 }}>
          Run not found
        </h2>
        <Link
          href="/backups"
          className="btn btn-outline"
          style={{ marginTop: 16, display: "inline-flex" }}
        >
          ← Back
        </Link>
      </div>
    );
  }

  const { run, results } = data;

  return (
    <div className="page">
      <Link
        href="/backups"
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        ← Back to runs
      </Link>

      <div className="page-head">
        <div>
          <h1 className="page-title">Run #{run.id}</h1>
          <p className="text-sm text-secondary">
            {formatDate(run.started_at)} · {formatDuration(run.duration_ms)}
          </p>
        </div>
        <span
          className={`badge ${run.status === "completed" ? "badge-success" : "badge-error"}`}
          style={{ fontSize: 13, padding: "6px 14px" }}
        >
          {run.status}
        </span>
      </div>

      <div className="metric-grid metric-grid--four stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{run.total_repos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Success</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {run.successful}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div
            className="stat-value"
            style={{ color: run.failed > 0 ? "var(--danger)" : "inherit" }}
          >
            {run.failed}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Skipped</div>
          <div className="stat-value">{run.skipped}</div>
        </div>
      </div>

      <div className="card table-card">
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            Repository results
          </span>
          <span className="text-xs text-muted" style={{ marginLeft: 8 }}>
            ({results.length})
          </span>
        </div>
        {results.length === 0 ? (
          <p
            className="text-sm text-muted"
            style={{ padding: 32, textAlign: "center" }}
          >
            No results
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Status</th>
                  <th>Hash</th>
                  <th>Size</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td
                      data-label="Repository"
                      style={{ fontWeight: 500, fontSize: 13 }}
                    >
                      {r.repo_full_name}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`badge ${r.status === "completed" ? "badge-success" : r.status === "failed" ? "badge-error" : "badge-neutral"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td
                      data-label="Hash"
                      className="text-xs text-muted"
                      style={{ fontFamily: "monospace" }}
                    >
                      {r.commit_hash ? r.commit_hash.slice(0, 8) : "—"}
                    </td>
                    <td data-label="Size" style={{ fontSize: 13 }}>
                      {r.archive_size_bytes > 0
                        ? formatBytes(r.archive_size_bytes)
                        : "—"}
                    </td>
                    <td
                      data-label="Error"
                      className="truncate"
                      style={{
                        color: "var(--danger)",
                        fontSize: 12,
                        maxWidth: 200,
                      }}
                    >
                      {r.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
