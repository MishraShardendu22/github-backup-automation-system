"use client";

import { useEffect, useMemo, useState } from "react";
import { getAnalyticsHistory } from "@/lib/api";
import type { RepoAnalyticsSnapshot } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { PaginationBar } from "@/components/analytics/pagination-bar";
import { AnalyticsSubNav } from "@/components/analytics/analytics-sub-nav";

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<RepoAnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getAnalyticsHistory()
      .then(setSnapshots)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(snapshots.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return snapshots.slice(start, start + pageSize);
  }, [snapshots, page, pageSize]);

  const handlePageSize = (s: number) => {
    setPageSize(s);
    setPage(1);
  };

  // Totals across all snapshots for the header summary
  const latest = snapshots[0] ?? null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-kicker">Analytics · Git Snapshots</div>
            <h1 className="page-title">Repository Snapshots</h1>
            <p className="page-subtitle">
              Git metadata captured by the backend collector at each backup
              point — commits, branches, tags, blob sizes, and archive sizes.
            </p>
          </div>
          {snapshots.length > 0 && (
            <div className="pill" style={{ alignSelf: "flex-start" }}>
              {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <AnalyticsSubNav />

        {/* ── Latest snapshot summary ─────────────────────────────────── */}
        {!loading && !error && latest && (
          <section className="card section-card">
            <div className="section-title">Latest snapshot</div>
            <div className="section-desc">
              Captured {formatDate(latest.captured_at)}
              {latest.head_commit && (
                <>
                  {" "}· commit{" "}
                  <code style={{ fontSize: 12, fontFamily: "monospace", color: "var(--accent)" }}>
                    {latest.head_commit.slice(0, 10)}
                  </code>
                </>
              )}
              {latest.head_commit_message && ` — ${latest.head_commit_message}`}
            </div>
            <div className="metric-grid metric-grid--four" style={{ marginTop: 14 }}>
              <div className="card-flat">
                <div className="stat-label">Total commits</div>
                <div className="stat-value stat-value--md">{latest.total_commits}</div>
              </div>
              <div className="card-flat">
                <div className="stat-label">Branches</div>
                <div className="stat-value stat-value--md">{latest.branch_count}</div>
              </div>
              <div className="card-flat">
                <div className="stat-label">Tracked files</div>
                <div className="stat-value stat-value--md">{latest.tracked_files}</div>
              </div>
              <div className="card-flat">
                <div className="stat-label">Total archive size</div>
                <div className="stat-value stat-value--md">
                  {formatBytes(latest.total_archive_size_bytes)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── History table ───────────────────────────────────────────── */}
        <section className="card section-card">
          <div className="section-title">Full history</div>

          {loading ? (
            <Spinner />
          ) : error ? (
            <p style={{ color: "var(--danger)", fontSize: 13, paddingTop: 12 }}>
              Failed to load snapshots. Check the backend is running.
            </p>
          ) : snapshots.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-secondary)" }}>
                No snapshots yet
              </p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Run the backup worker to start collecting repository analytics.
              </p>
            </div>
          ) : (
            <>
              <div className="table-wrap" style={{ marginTop: 14 }}>
                <table className="table table-wide">
                  <thead>
                    <tr>
                      <th>Captured at</th>
                      <th>Commit</th>
                      <th>Message</th>
                      <th>Commits</th>
                      <th>Branches</th>
                      <th>Tags</th>
                      <th>Files</th>
                      <th>Blob size</th>
                      <th>Archive size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((snap) => (
                      <tr key={snap.id}>
                        <td className="text-xs">{formatDate(snap.captured_at)}</td>
                        <td
                          className="text-xs text-muted"
                          style={{ fontFamily: "monospace" }}
                        >
                          {snap.head_commit ? snap.head_commit.slice(0, 10) : "—"}
                        </td>
                        <td
                          className="truncate text-xs"
                          style={{ maxWidth: 180 }}
                          title={snap.head_commit_message}
                        >
                          {snap.head_commit_message || "—"}
                        </td>
                        <td>{snap.total_commits}</td>
                        <td>{snap.branch_count}</td>
                        <td>{snap.tag_count}</td>
                        <td>{snap.tracked_files}</td>
                        <td>{formatBytes(snap.total_blob_size_bytes)}</td>
                        <td>{formatBytes(snap.total_archive_size_bytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={snapshots.length}
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
      Loading snapshots…
    </div>
  );
}
