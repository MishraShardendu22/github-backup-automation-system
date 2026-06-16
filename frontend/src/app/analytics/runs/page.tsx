"use client";

import { useEffect, useMemo, useState } from "react";
import { getMetrics } from "@/lib/api";
import type { BackupRun } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { PaginationBar } from "@/components/analytics/pagination-bar";
import { AnalyticsSubNav } from "@/components/analytics/analytics-sub-nav";
import Link from "next/link";

const DAY_OPTIONS = [7, 14, 30, 90] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

export default function RunHistoryPage() {
  const [days, setDays] = useState<DayOption>(30);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setPage(1);
    getMetrics(days)
      .then((data) => setRuns(data?.runs ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [days]);

  const totalPages = Math.max(1, Math.ceil(runs.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return runs.slice(start, start + pageSize);
  }, [runs, page, pageSize]);

  const handlePageSize = (s: number) => {
    setPageSize(s);
    setPage(1);
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-kicker">Analytics · Run History</div>
            <h1 className="page-title">Backup Runs</h1>
            <p className="page-subtitle">
              Full paginated history of all backup runs within the selected time
              window. Click a run to see per-repository results.
            </p>
          </div>

          <nav className="segmented" aria-label="Day range" style={{ alignSelf: "flex-start" }}>
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDays(opt)}
                className={`segmented-btn${days === opt ? " segmented-btn--active" : ""}`}
                aria-pressed={days === opt}
              >
                {opt}d
              </button>
            ))}
          </nav>
        </div>

        <AnalyticsSubNav />

        <section className="card section-card">
          {loading ? (
            <Spinner />
          ) : error ? (
            <p style={{ color: "var(--danger)", fontSize: 13 }}>
              Failed to load run history. Check the backend is running.
            </p>
          ) : runs.length === 0 ? (
            <EmptyRuns days={days} />
          ) : (
            <>
              <div className="table-wrap">
                <table className="table table-wide">
                  <thead>
                    <tr>
                      <th>Run #</th>
                      <th>Status</th>
                      <th>Started</th>
                      <th>Duration</th>
                      <th>Repos</th>
                      <th>✓ OK</th>
                      <th>✗ Failed</th>
                      <th>Skipped</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((run) => (
                      <tr key={run.id}>
                        <td style={{ fontWeight: 600 }}>#{run.id}</td>
                        <td>
                          <span
                            className={`badge ${
                              run.status === "completed"
                                ? "badge-success"
                                : run.status === "running"
                                  ? "badge-running"
                                  : "badge-error"
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="text-xs text-muted">{formatDate(run.started_at)}</td>
                        <td>{formatDuration(run.duration_ms)}</td>
                        <td>{run.total_repos}</td>
                        <td style={{ color: "var(--success)" }}>{run.successful}</td>
                        <td style={{ color: run.failed > 0 ? "var(--danger)" : "inherit" }}>
                          {run.failed}
                        </td>
                        <td className="text-muted">{run.skipped}</td>
                        <td>
                          <Link
                            href={`/backups/${run.id}`}
                            className="btn btn-ghost"
                            style={{ fontSize: 12 }}
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={runs.length}
                onPage={setPage}
                onPageSize={handlePageSize}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: 13, padding: "24px 0" }}>
      <span style={{ width: 16, height: 16, border: "2px solid rgba(212,168,50,0.3)", borderTopColor: "var(--accent)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
      Loading runs…
    </div>
  );
}

function EmptyRuns({ days }: { days: number }) {
  return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-secondary)" }}>
        No runs in the last {days} days
      </p>
      <p style={{ fontSize: 13, marginTop: 6 }}>
        Try selecting a longer range, or start the backup worker.
      </p>
    </div>
  );
}
