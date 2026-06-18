"use client";

import { useState, useCallback } from "react";
import { backupService } from "@/services/backup.service";
import type { BackupRun, PaginatedResponse } from "@/types";

export function useBackups() {
  const [runs, setRuns] = useState<PaginatedResponse<BackupRun> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async (page = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await backupService.getRuns(page, limit);
      setRuns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch backups");
      console.error("Failed to fetch backups", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRun = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      return await backupService.getRun(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch backup run");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    try {
      return await backupService.getLatest();
    } catch (e) {
      console.error("Failed to fetch latest backup", e);
      return { run: null };
    }
  }, []);

  return {
    runs,
    loading,
    error,
    fetchRuns,
    fetchRun,
    fetchLatest,
  };
}
