import httpx
from config.settings import settings

class GoBackendClient:
    def __init__(self):
        self.base_url = settings.GO_BACKEND_URL

    async def get(self, endpoint: str, params: dict | None = None):
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{self.base_url}{endpoint}", params=params)
            response.raise_for_status()
            return response.json()

    async def get_dashboard_stats(self):
        return await self.get("/api/dashboard/stats")

    async def list_backups(self, page: int = 1, limit: int = 50):
        return await self.get("/api/backups", {"page": page, "limit": limit})

    async def get_latest_backup(self):
        return await self.get("/api/backups/latest")

    async def get_backup_details(self, backup_id: int):
        return await self.get(f"/api/backups/{backup_id}")

    async def get_metrics(self, days: int = 30, page: int = 1, limit: int = 50):
        return await self.get("/api/metrics", {"days": days, "page": page, "limit": limit})

    async def list_analytics_history(self, page: int = 1, limit: int = 50):
        return await self.get("/api/analytics/history", {"page": page, "limit": limit})

    async def get_latest_analytics(self):
        return await self.get("/api/analytics/latest")

    async def get_analytics_for_run(self, run_id: int):
        return await self.get(f"/api/analytics/{run_id}")

    async def list_repos(self, page: int = 1, limit: int = 50):
        return await self.get("/api/repos", {"page": page, "limit": limit})

    async def list_logs( self, page: int = 1, limit: int = 100, level: str | None = None, run_id: int | None = None):
        params = {"page": page, "limit": limit}
        if level is not None:
            params["level"] = level
        if run_id is not None:
            params["run_id"] = run_id

        return await self.get("/api/logs", params)