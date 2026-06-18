import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { serverFetch } from "@/lib/server-api";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";
import type { BackupResult, BackupRun } from "@/types";

interface BackupDetail {
  run: BackupRun;
  results: BackupResult[];
}

async function fetchBackupDetail(id: string): Promise<BackupDetail | null> {
  return serverFetch<BackupDetail>(`/api/backups/${id}`);
}

export default async function BackupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchBackupDetail(id);

  if (!data?.run) {
    notFound();
  }

  const { run, results = [] } = data;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">
            <Link
              href="/backups"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Backup History
            </Link>{" "}
            / Run #{run.id}
          </div>
          <h1 className="page-title">Run #{run.id}</h1>
          <p className="page-subtitle">
            Started {formatDate(run.started_at)} ·{" "}
            {formatDuration(run.duration_ms)}
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {/* Summary metrics */}
      <div className="metric-grid metric-grid--four stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total repos</div>
          <div className="stat-value">{run.total_repos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Successful</div>
          <div className="stat-value stat-value--success">{run.successful}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value stat-value--danger">{run.failed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Skipped</div>
          <div className="stat-value text-muted">{run.skipped}</div>
        </div>
      </div>

      {/* Repository results */}
      <section className="card section-card">
        <div className="section-title">Repository results</div>
        {results.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              padding: "20px 0",
            }}
          >
            No repository logs for this run.
          </p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table table-wide">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Status</th>
                  <th>Archive size</th>
                  <th>Commit</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td style={{ fontWeight: 500 }}>{result.repo_full_name}</td>
                    <td>
                      <StatusBadge status={result.status} />
                    </td>
                    <td>
                      {result.archive_size_bytes > 0
                        ? formatBytes(result.archive_size_bytes)
                        : "—"}
                    </td>
                    <td
                      className="text-xs"
                      style={{
                        fontFamily: "monospace",
                        color: "var(--text-muted)",
                      }}
                    >
                      {result.commit_hash
                        ? result.commit_hash.slice(0, 10)
                        : "—"}
                    </td>
                    <td
                      className="text-xs"
                      style={{
                        color: result.error_message
                          ? "var(--danger)"
                          : "var(--text-muted)",
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={result.error_message || ""}
                    >
                      {result.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
