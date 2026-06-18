"use client";

import { useCallback, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import type { PaginatedResponse, RepoAnalyticsSnapshot } from "@/types";

export function useAnalytics() {
  const [history, setHistory] =
    useState<PaginatedResponse<RepoAnalyticsSnapshot> | null>(null);
  const [latest, setLatest] = useState<RepoAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (page = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getHistory(page, limit);
      setHistory(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to fetch analytics history",
      );
      console.error("Failed to fetch analytics history", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getLatest();
      setLatest(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to fetch latest analytics",
      );
      console.error("Failed to fetch latest analytics", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchForRun = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      return await analyticsService.getForRun(id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to fetch analytics for run",
      );
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    latest,
    loading,
    error,
    fetchHistory,
    fetchLatest,
    fetchForRun,
  };
}
