#!/usr/bin/env python3
"""
Production launcher for Azure AI Foundry Multi-Agent Business Assistant.
Serves the FastAPI API and frontend as a unified single service.
Suitable for local execution and production deployment on Render.
"""

import os
import sys
import uvicorn

if __name__ == "__main__":
    # Support Render's dynamic PORT environment variable, defaulting to 8000
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print(f"🚀 Starting Azure AI Foundry Multi-Agent Business Assistant on {host}:{port}...")
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=False,
    )
