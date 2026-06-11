package routes

import (
	"github.com/MishraShardendu22/github-backup/backend/handlers"
	"github.com/MishraShardendu22/github-backup/backend/middleware"
	"github.com/MishraShardendu22/github-backup/backend/websocket"
	"github.com/gofiber/fiber/v2"
	ws "github.com/gofiber/websocket/v2"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")
	api.Use(middleware.RateLimitDefault())

	api.Get("/backups", handlers.GetBackupRuns)
	api.Get("/backups/latest", handlers.GetLatestBackup)
	api.Get("/backups/:id", handlers.GetBackupRun)

	api.Get("/dashboard/stats", handlers.GetDashboardStats)
	api.Get("/metrics", handlers.GetMetrics)
	api.Get("/logs", handlers.GetLogs)
	api.Get("/repos", handlers.GetRepos)

	ai := api.Group("/ai", middleware.RateLimitStrict())
	ai.Post("/ai/chat", handlers.PostChat)
	ai.Get("/ai/conversations", handlers.GetConversations)
	ai.Get("/ai/conversations/:id", handlers.GetConversation)
	ai.Delete("/ai/conversations/:id", handlers.DeleteConversation)

	api.Get("/reports/latest", handlers.GetLatestReport)
	api.Post("/reports/latest", handlers.GetLatestReport)
	api.Post("/reports/send", handlers.SendReport)
	api.Get("/reports/history", handlers.GetReportHistory)

	api.Get("/system/health", handlers.GetSystemHealth)
	api.Get("/system/live", handlers.GetLiveStatus)

	app.Use("/ws", func(c *fiber.Ctx) error {
		if ws.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws/live", ws.New(websocket.HandleWebSocket))
}
