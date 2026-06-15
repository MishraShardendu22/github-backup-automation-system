package models

import (
	"time"
)

type BackupRun struct {
	StartedAt    time.Time  `json:"started_at"`
	CompletedAt  *time.Time `json:"completed_at"`
	ID           int        `json:"id"`
	TotalRepos   int        `json:"total_repos"`
	Successful   int        `json:"successful"`
	Failed       int        `json:"failed"`
	Skipped      int        `json:"skipped"`
	DurationMs   int64      `json:"duration_ms"`
	Status       string     `json:"status"`
	ErrorMessage string     `json:"error_message"`
}

type BackupResult struct {
	ID               int       `json:"id"`
	RunID            int       `json:"run_id"`
	ArchiveSizeBytes int64     `json:"archive_size_bytes"`
	DurationMs       int64     `json:"duration_ms"`
	RepoFullName     string    `json:"repo_full_name"`
	Status           string    `json:"status"`
	CommitHash       string    `json:"commit_hash"`
	ErrorMessage     string    `json:"error_message"`
	CreatedAt        time.Time `json:"created_at"`
}

type ExecutionLog struct {
	ID         int       `json:"id"`
	RunID      *int      `json:"run_id"`
	Level      string    `json:"level"`
	Message    string    `json:"message"`
	Repository string    `json:"repository"`
	CreatedAt  time.Time `json:"created_at"`
}

type Conversation struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatMessage struct {
	ID             int       `json:"id"`
	ConversationID int       `json:"conversation_id"`
	TokensUsed     int       `json:"tokens_used"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	WebSearch      bool      `json:"web_search"`
	CreatedAt      time.Time `json:"created_at"`
}

type ReportHistory struct {
	ID           int       `json:"id"`
	ReportType   string    `json:"report_type"`
	Recipients   string    `json:"recipients"`
	Subject      string    `json:"subject"`
	Status       string    `json:"status"`
	ErrorMessage string    `json:"error_message"`
	SentAt       time.Time `json:"sent_at"`
}

type RepoAnalyticsSnapshot struct {
	CapturedAt              time.Time  `json:"captured_at"`
	HeadCommitAt            *time.Time `json:"head_commit_at"`
	RunID                   *int       `json:"run_id"`
	ID                      int        `json:"id"`
	TotalCommits            int        `json:"total_commits"`
	BranchCount             int        `json:"branch_count"`
	TagCount                int        `json:"tag_count"`
	TrackedFiles            int        `json:"tracked_files"`
	ArchiveCount            int        `json:"archive_count"`
	TotalBlobSizeBytes      int64      `json:"total_blob_size_bytes"`
	AvgBlobSizeBytes        int64      `json:"avg_blob_size_bytes"`
	LargestBlobSizeBytes    int64      `json:"largest_blob_size_bytes"`
	TotalArchiveSizeBytes   int64      `json:"total_archive_size_bytes"`
	LargestArchiveSizeBytes int64      `json:"largest_archive_size_bytes"`
	AvgArchiveSizeBytes     int64      `json:"avg_archive_size_bytes"`
	HeadCommit              string     `json:"head_commit"`
	HeadCommitMessage       string     `json:"head_commit_message"`
	LargestArchivePath      string     `json:"largest_archive_path"`
	LargestBlobPath         string     `json:"largest_blob_path"`
}

type DashboardStats struct {
	LastRunAt           *time.Time             `json:"last_run_at"`
	LastRunStatus       string                 `json:"last_run_status"`
	LargestRepository   string                 `json:"largest_repository"`
	TotalFailed         int                    `json:"total_failed"`
	TotalRuns           int                    `json:"total_runs"`
	TotalRepos          int                    `json:"total_repos"`
	TotalSuccessful     int                    `json:"total_successful"`
	TotalSkipped        int                    `json:"total_skipped"`
	DistinctRepos       int                    `json:"distinct_repos"`
	TotalLogs           int                    `json:"total_logs"`
	AvgDurationMs       int64                  `json:"avg_duration_ms"`
	TotalSizeBytes      int64                  `json:"total_size_bytes"`
	LargestArchiveBytes int64                  `json:"largest_archive_bytes"`
	SuccessRate         float64                `json:"success_rate"`
	LatestAnalytics     *RepoAnalyticsSnapshot `json:"latest_analytics"`
}

type LiveStatus struct {
	WorkerRunning bool       `json:"worker_running"`
	CurrentRunID  *int       `json:"current_run_id"`
	Progress      int        `json:"progress"`
	TotalRepos    int        `json:"total_repos"`
	CurrentRepo   string     `json:"current_repo"`
	StartedAt     *time.Time `json:"started_at"`
}
