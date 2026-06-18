"use client";

import { useCallback, useEffect, useState } from "react";
import { statsService } from "@/services/stats.service";
import type { DashboardStats } from "@/types";

export function useStats(token?: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statsService.get(token);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch stats");
      console.error("Failed to fetch stats", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
