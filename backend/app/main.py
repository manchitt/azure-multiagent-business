import os
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .services.azure_foundry import AzureFoundryService

app = FastAPI(
    title="MABA — Multi-Agent Business Assistant",
    description="Production FastAPI service for MABA powered by Azure AI Foundry business-orchestrator:13 (GPT-5-mini).",
    version="2.1.0",
)

# CORS Middleware (allows same-origin as well as any client)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Real Azure AI Foundry Service Singleton
azure_foundry = AzureFoundryService()


@app.on_event("startup")
async def startup_event():
    """Warm up Azure AI Foundry connections on boot to eliminate initial request latency."""
    azure_foundry.warmup()


# Directory for static frontend assets
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


class ChatMessageRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    input: Optional[str] = None


@app.get("/api/health")
async def health():
    """Health check endpoint indicating Azure AI Foundry integration status."""
    return azure_foundry.get_status()


@app.post("/chat")
async def chat(request: ChatMessageRequest):
    """
    Main chat endpoint calling the real Azure AI Foundry business-orchestrator (v13).
    Accepts message or query or input.
    """
    user_prompt = request.message or request.query or request.input
    if not user_prompt or not user_prompt.strip():
        raise HTTPException(status_code=400, detail="Missing 'message' or 'query' in request body.")

    try:
        result = await azure_foundry.execute_query(user_prompt.strip())
        return result
    except Exception as e:
        # Return structured error details without leaking private keys
        raise HTTPException(
            status_code=500,
            detail=f"Azure AI Foundry Orchestrator error: {str(e)}",
        )


@app.post("/api/query")
async def api_query(request: ChatMessageRequest):
    """Compatibility alias for /chat."""
    return await chat(request)


# Serve Static Frontend files (One unified FastAPI deployment)
if (FRONTEND_DIR / "css").exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")

if (FRONTEND_DIR / "js").exists():
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")


@app.get("/")
async def index():
    """Serves the primary web user interface."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Frontend index.html not found"}
