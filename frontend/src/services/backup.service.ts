import { fetchAPI } from "@/lib/api";
import type { BackupRun, BackupResult, PaginatedResponse } from "@/types";

export const backupService = {
  getRuns: (page = 1, limit = 50) =>
    fetchAPI<PaginatedResponse<BackupRun>>(`/api/backups?page=${page}&limit=${limit}`),

  getRun: (id: number) =>
    fetchAPI<{ run: BackupRun; results: BackupResult[] }>(`/api/backups/${id}`),

  getLatest: () =>
    fetchAPI<{ run: BackupRun | null }>("/api/backups/latest"),
};
