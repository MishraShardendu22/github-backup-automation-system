"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBackupRuns } from "@/lib/api";
import type { BackupRun } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { PaginationBar } from "@/components/analytics/pagination-bar";

export default function BackupsPage() {
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getBackupRuns(page, pageSize)
      .then((res) => {
        setRuns(res.data);
        setTotalItems(res.pagination.total_items);
        setTotalPages(res.pagination.total_pages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

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
            <div className="page-kicker">History</div>
            <h1 className="page-title">Backup runs</h1>
            <p className="page-subtitle">
              Complete history of all backup executions and their results.
            </p>
          </div>
        </div>

        <div className="card table-card">
          {loading ? (
            <div style={{ padding: 48, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, color: "var(--text-muted)" }}>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(212,168,50,0.3)", borderTopColor: "var(--accent)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              Loading runs…
            </div>
          ) : error ? (
            <p style={{ color: "var(--danger)", padding: 48, textAlign: "center" }}>
              Failed to load backups.
            </p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted" style={{ padding: 48, textAlign: "center" }}>
              No backup runs found. Run the worker to create backups.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Total</th>
                    <th>Success</th>
                    <th>Failed</th>
                    <th>Skipped</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td data-label="Run" style={{ fontWeight: 500 }}>
                        #{run.id}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`badge ${run.status === "completed" ? "badge-success" : run.status === "running" ? "badge-running" : "badge-error"}`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td data-label="Date" className="text-xs text-secondary">
                        {formatDate(run.started_at)}
                      </td>
                      <td data-label="Duration">
                        {formatDuration(run.duration_ms)}
                      </td>
                      <td data-label="Total">{run.total_repos}</td>
                      <td data-label="Success" style={{ color: "var(--success)" }}>
                        {run.successful}
                      </td>
                      <td
                        data-label="Failed"
                        style={{ color: run.failed > 0 ? "var(--danger)" : "inherit" }}
                      >
                        {run.failed}
                      </td>
                      <td data-label="Skipped" className="text-muted">
                        {run.skipped}
                      </td>
                      <td data-label="Details">
                        <Link
                          href={`/backups/${run.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: 12 }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: "0 20px 20px" }}>
                <PaginationBar
                  page={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPage={setPage}
                  onPageSize={handlePageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
