"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { getMetrics } from "@/lib/api";
import type { MetricsData } from "@/lib/types";
import { formatBytes, formatDuration } from "@/lib/utils";
import { AnalyticsSubNav } from "@/components/analytics/analytics-sub-nav";

const DAY_OPTIONS = [7, 14, 30, 90] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

const tooltipStyle = {
  background: "rgba(20,18,16,0.97)",
  border: "1px solid rgba(212,168,50,0.22)",
  borderRadius: 8,
  fontSize: 12,
  color: "#F0EAD6",
  boxShadow: "0 10px 24px rgba(0,0,0,0.32)",
};

export default function AnalyticsOverviewPage() {
  const [days, setDays] = useState<DayOption>(30);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getMetrics(days)
      .then(setMetrics)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [days]);

  const chartData = useMemo(() => {
    if (!metrics?.runs) return [];
    return metrics.runs.map((run) => ({
      date: new Date(run.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      successful: run.successful,
      failed: run.failed,
      duration: Math.round(run.duration_ms / 1000),
    }));
  }, [metrics]);

  const hasData = chartData.length > 0;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-kicker">Analytics</div>
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle">
              Backup performance trends over time. Use the tabs below to browse
              detailed run history or Git snapshot records.
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

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="card section-card" style={{ padding: "28px 24px" }}>
            <Spinner />
          </div>
        ) : error ? (
          <div className="card section-card" style={{ padding: "20px 24px", color: "var(--danger)", fontSize: 13 }}>
            Failed to load metrics. Check that the backend is running.
          </div>
        ) : !hasData ? (
          <InsufficientData days={days} />
        ) : (
          <div className="metric-grid metric-grid--four stats-grid">
            <div className="stat-card">
              <div className="stat-label">Runs in {days}d window</div>
              <div className="stat-value">{metrics?.total_runs ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg duration</div>
              <div className="stat-value">
                {metrics?.avg_duration_ms ? formatDuration(metrics.avg_duration_ms) : "—"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Successful</div>
              <div className="stat-value stat-value--success">
                {metrics?.total_successful ?? 0}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Failed</div>
              <div className="stat-value stat-value--danger">
                {metrics?.total_failed ?? 0}
              </div>
            </div>
          </div>
        )}

        {/* ── Charts ────────────────────────────────────────────────────── */}
        {!loading && hasData && (
          <div className="split-grid">
            <section className="card chart-card">
              <div className="section-title">Success vs failure — {days}d</div>
              <div className="chart-frame">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="#A09167" fontSize={11} />
                    <YAxis stroke="#A09167" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="successful" name="Successful" fill="#6FCF7F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed" fill="#E07070" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card chart-card">
              <div className="section-title">Duration trend — {days}d (seconds)</div>
              <div className="chart-frame">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="#A09167" fontSize={11} />
                    <YAxis stroke="#A09167" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="duration"
                      name="Duration (s)"
                      stroke="var(--accent)"
                      fill="rgba(212,168,50,0.1)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {/* ── Storage summary (only on overview) ─────────────────────────── */}
        {!loading && metrics && (
          <div className="split-grid">
            {/* Storage card */}
            <div className="card section-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(212,168,50,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
                  </svg>
                </div>
                <div>
                  <div className="section-title" style={{ marginBottom: 0 }}>Storage</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                    Last {days} days
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <StorageStat label="Total size" value={formatBytes(metrics.total_size_bytes ?? 0)} accent />
                <StorageStat label="Largest archive" value={formatBytes(metrics.largest_archive_bytes ?? 0)} />
                <StorageStat label="Distinct repos" value={String(metrics.distinct_repos ?? 0)} />
                <StorageStat
                  label="Largest repo"
                  value={metrics.largest_repository || "—"}
                  truncate
                />
              </div>
            </div>

            {/* Dive deeper card */}
            <div className="card section-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(212,168,50,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
                  </svg>
                </div>
                <div>
                  <div className="section-title" style={{ marginBottom: 0 }}>Explore</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                    Detailed historical data
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <DiveLink
                  href="/analytics/runs"
                  label="Run History"
                  desc="Full paginated table of all backup runs"
                  icon={
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 21V9"/>
                    </>
                  }
                />
                <DiveLink
                  href="/analytics/snapshots"
                  label="Git Snapshots"
                  desc="Repository analytics at each backup point"
                  icon={
                    <>
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                    </>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: 13 }}>
      <span
        style={{
          width: 16,
          height: 16,
          border: "2px solid rgba(212,168,50,0.3)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          display: "inline-block",
          animation: "spin 0.8s linear infinite",
        }}
      />
      Loading metrics…
    </div>
  );
}

function InsufficientData({ days }: { days: number }) {
  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 8,
        background: "rgba(212,168,50,0.06)",
        border: "1px solid rgba(212,168,50,0.18)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>
          No data for the {days}-day window
        </p>
        <p style={{ fontSize: 12, marginTop: 4, color: "var(--text-muted)" }}>
          No backup runs were recorded in the last {days} days. Try a longer range
          or start the backup worker.
        </p>
      </div>
    </div>
  );
}

function StorageStat({
  label,
  value,
  accent,
  truncate,
}: {
  label: string;
  value: string;
  accent?: boolean;
  truncate?: boolean;
}) {
  return (
    <div
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(212,168,50,0.10), rgba(212,168,50,0.02))"
          : "rgba(255,255,255,0.03)",
        border: accent
          ? "1px solid rgba(212,168,50,0.20)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: accent ? "var(--accent)" : "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: truncate ? "nowrap" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DiveLink({
  href,
  label,
  desc,
  icon,
}: {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,168,50,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, opacity: 0.7 }}
        aria-hidden="true"
      >
        {icon}
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
          {desc}
        </div>
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
