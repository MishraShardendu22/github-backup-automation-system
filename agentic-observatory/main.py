from data import client
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent import invoke_agent, stream_agent
from utils import success_response

app = FastAPI(
    title="Github Backup Observation Agent",
    version="1.0.0",
)

class ChatRequest(BaseModel):
    question: str

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

@app.get("/chat")
async def chat_get(question: str = Query(..., description="Question for the agent")):
    agent_response = await invoke_agent(question)
    return success_response(
        data=agent_response.dict(),
        message="Chat response",
    )

@app.post("/chat")
async def chat(request: ChatRequest):
    agent_response = await invoke_agent(request.question)
    return success_response(
        data=agent_response.dict(),
        message="Chat response",
    )

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def event_generator():
        async for token in stream_agent(request.question):
            sse_token = token.replace("\n", "\ndata: ")
            yield f"data: {sse_token}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )