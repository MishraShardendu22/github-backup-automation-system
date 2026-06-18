import { fetchAPI } from "@/lib/api";
import type { RepoAnalyticsSnapshot, PaginatedResponse } from "@/types";

export const analyticsService = {
  getHistory: (page = 1, limit = 50) =>
    fetchAPI<PaginatedResponse<RepoAnalyticsSnapshot>>(
      `/api/analytics/history?page=${page}&limit=${limit}`
    ),

  getLatest: () =>
    fetchAPI<RepoAnalyticsSnapshot>("/api/analytics/latest"),

  getForRun: (id: number) =>
    fetchAPI<RepoAnalyticsSnapshot>(`/api/analytics/${id}`),
};
