const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || res.statusText);
  }

  return res.json();
}

// ─── Backups ────────────────────────────────────────────────────────────────
export const getBackupRuns = (page = 1, limit = 50) =>
  fetchAPI<import("./types").PaginatedResponse<import("./types").BackupRun>>(
    `/api/backups?page=${page}&limit=${limit}`
  );

export const getBackupRun = (id: number) =>
  fetchAPI<{
    run: import("./types").BackupRun;
    results: import("./types").BackupResult[];
  }>(`/api/backups/${id}`);

export const getLatestBackup = () =>
  fetchAPI<{ run: import("./types").BackupRun | null }>("/api/backups/latest");

// ─── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  fetchAPI<import("./types").DashboardStats>("/api/dashboard/stats");

// ─── Metrics ────────────────────────────────────────────────────────────────
export const getMetrics = (days = 30) =>
  fetchAPI<import("./types").MetricsData>(`/api/metrics?days=${days}`);

// ─── Logs ───────────────────────────────────────────────────────────────────
export const getLogs = (page = 1, limit = 100, level?: string, runId?: string) => {
  let url = `/api/logs?page=${page}&limit=${limit}`;
  if (level) url += `&level=${level}`;
  if (runId) url += `&run_id=${runId}`;
  return fetchAPI<import("./types").PaginatedResponse<import("./types").ExecutionLog>>(url);
};

// ─── Repos ──────────────────────────────────────────────────────────────────
export const getRepos = (page = 1, limit = 50) =>
  fetchAPI<import("./types").PaginatedResponse<import("./types").RepoInfo>>(`/api/repos?page=${page}&limit=${limit}`);

// ─── Analytics ──────────────────────────────────────────────────────────────
/** All analytics snapshots ordered by captured_at DESC */
export const getAnalyticsHistory = (page = 1, limit = 50) =>
  fetchAPI<import("./types").PaginatedResponse<import("./types").RepoAnalyticsSnapshot>>(`/api/analytics/history?page=${page}&limit=${limit}`);

/** Latest analytics snapshot (most recent captured_at) */
export const getAnalyticsLatest = () =>
  fetchAPI<import("./types").RepoAnalyticsSnapshot>("/api/analytics/latest");

/** Analytics snapshot for a specific run ID */
export const getAnalyticsForRun = (id: number) =>
  fetchAPI<import("./types").RepoAnalyticsSnapshot>(`/api/analytics/${id}`);