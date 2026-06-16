package handlers

import (
	"context"
	"strconv"

	"github.com/MishraShardendu22/github-backup/backend/db"
	"github.com/MishraShardendu22/github-backup/backend/models"
	"github.com/gofiber/fiber/v2"
)

func GetAnalyticsRuns(c *fiber.Ctx) error {
	rows, err := db.Pool.Query( context.Background(),`
		SELECT id, run_id, captured_at, head_commit, head_commit_message, head_commit_at, total_commits, branch_count, tag_count, tracked_files, total_blob_size_bytes, avg_blob_size_bytes, largest_blob_path, largest_blob_size_bytes, archive_count, total_archive_size_bytes, avg_archive_size_bytes, largest_archive_path, largest_archive_size_bytes
		FROM analytics_snapshots
		ORDER BY captured_at DESC
		`,
	)

	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	defer rows.Close()

	var snapshots []models.RepoAnalyticsSnapshot

	for rows.Next() {
		var snapshot models.RepoAnalyticsSnapshot

		err := rows.Scan( &snapshot.ID, &snapshot.RunID, &snapshot.CapturedAt, &snapshot.HeadCommit, &snapshot.HeadCommitMessage, &snapshot.HeadCommitAt, &snapshot.TotalCommits, &snapshot.BranchCount, &snapshot.TagCount, &snapshot.TrackedFiles, &snapshot.TotalBlobSizeBytes, &snapshot.AvgBlobSizeBytes, &snapshot.LargestBlobPath, &snapshot.LargestBlobSizeBytes, &snapshot.ArchiveCount, &snapshot.TotalArchiveSizeBytes, &snapshot.AvgArchiveSizeBytes, &snapshot.LargestArchivePath, &snapshot.LargestArchiveSizeBytes)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		snapshots = append(snapshots, snapshot)
	}

	return c.JSON(snapshots)
}

func GetAnalyticsForLatestRun(c *fiber.Ctx) error {
	var snapshot models.RepoAnalyticsSnapshot

	err := db.Pool.QueryRow(
		context.Background(),
		`
		SELECT id, run_id, captured_at, head_commit, head_commit_message, head_commit_at, total_commits, branch_count, tag_count, tracked_files, total_blob_size_bytes, avg_blob_size_bytes, largest_blob_path, largest_blob_size_bytes, archive_count, total_archive_size_bytes, avg_archive_size_bytes, largest_archive_path, largest_archive_size_bytes
		FROM analytics_snapshots
		ORDER BY captured_at DESC
		LIMIT 1
		`,
	).Scan( &snapshot.ID, &snapshot.RunID, &snapshot.CapturedAt, &snapshot.HeadCommit, &snapshot.HeadCommitMessage, &snapshot.HeadCommitAt, &snapshot.TotalCommits, &snapshot.BranchCount, &snapshot.TagCount, &snapshot.TrackedFiles, &snapshot.TotalBlobSizeBytes, &snapshot.AvgBlobSizeBytes, &snapshot.LargestBlobPath, &snapshot.LargestBlobSizeBytes, &snapshot.ArchiveCount, &snapshot.TotalArchiveSizeBytes, &snapshot.AvgArchiveSizeBytes, &snapshot.LargestArchivePath, &snapshot.LargestArchiveSizeBytes)

	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "analytics not found")
	}

	return c.JSON(snapshot)
}

func GetAnalyticsForSpecificRun(c *fiber.Ctx) error {
	runID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid run id")
	}

	var snapshot models.RepoAnalyticsSnapshot

	err = db.Pool.QueryRow(
		context.Background(),
		`
		SELECT id, run_id, captured_at, head_commit, head_commit_message, head_commit_at, total_commits, branch_count, tag_count, tracked_files, total_blob_size_bytes, avg_blob_size_bytes, largest_blob_path, largest_blob_size_bytes, archive_count, total_archive_size_bytes, avg_archive_size_bytes, largest_archive_path, largest_archive_size_bytes
		FROM analytics_snapshots
		WHERE run_id = $1
		LIMIT 1
		`,
		runID,
	).Scan( &snapshot.ID, &snapshot.RunID, &snapshot.CapturedAt, &snapshot.HeadCommit, &snapshot.HeadCommitMessage, &snapshot.HeadCommitAt, &snapshot.TotalCommits, &snapshot.BranchCount, &snapshot.TagCount, &snapshot.TrackedFiles, &snapshot.TotalBlobSizeBytes, &snapshot.AvgBlobSizeBytes, &snapshot.LargestBlobPath, &snapshot.LargestBlobSizeBytes, &snapshot.ArchiveCount, &snapshot.TotalArchiveSizeBytes, &snapshot.AvgArchiveSizeBytes, &snapshot.LargestArchivePath, &snapshot.LargestArchiveSizeBytes,)

	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "analytics not found")
	}

	return c.JSON(snapshot)
}