from fastapi import FastAPI
from utils.response import success_response
from clients.go_backend import GoBackendClient

client = GoBackendClient()

app = FastAPI(
    title="Github Backup Observation Agent",
    version="1.0.0",
)


@app.get("/health")
async def health_check():
    return success_response(
        data={"status": "ok"},
        message="Health check successful",
    )

@app.get("/test-backend")
async def test_backend():
    data = await client.get_dashboard_stats()
    return success_response(data=data)