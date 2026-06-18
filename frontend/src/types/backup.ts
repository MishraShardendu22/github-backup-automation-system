export interface BackupRun {
  id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_repos: number;
  successful: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  error_message: string;
}

export interface BackupResult {
  id: number;
  run_id: number;
  repo_full_name: string;
  status: string;
  commit_hash: string;
  archive_size_bytes: number;
  duration_ms: number;
  error_message: string;
  created_at: string;
}

export interface RepoInfo {
  full_name: string;
  last_status: string;
  last_commit_hash: string;
  archive_size_bytes: number;
  last_backed_up: string;
}

export interface ExecutionLog {
  id: number;
  run_id: number | null;
  level: string;
  message: string;
  repository: string;
  created_at: string;
}

export interface LiveStatus {
  worker_running: boolean;
  run?: {
    id: number;
    status: string;
    total_repos: number;
    successful: number;
    failed: number;
    skipped: number;
    started_at: string;
  };
}

export interface WsMessage {
  type: "log";
  id?: number;
  level?: string;
  message?: string;
  repository?: string;
  timestamp?: string;
}
