# ⚡ MABA — Multi-Agent Business Assistant

> Built on **Microsoft Azure AI Foundry** • **GPT-5-mini** • **Multi-Agent Orchestration (A2A)** • **Web Search** • **Document Grounding** • **FastAPI** • **Modern Frontend**

This application connects directly to your live **Azure AI Foundry** project to run your multi-agent architecture:

```
User (Web Interface)
  │
  ▼
FastAPI Backend (POST /chat)
  │
  ▼
Azure AI Foundry business-orchestrator:13 (GPT-5-mini)
  │
  ▼
A2A (Agent-to-Agent Mesh)
  ├── 🔎 Research Agent (Web Search Grounding)
  ├── 📊 Analyst Agent (Azure AI Search File Grounding)
  └── 🎯 Strategy Agent (Strategic Frameworks & Roadmaps)
  │
  ▼
Synthesized Business Response
```

---

## 🚀 Running Locally

```bash
# 1. Navigate to the project directory
cd /Users/manchit/.gemini/antigravity/scratch/azure-multiagent-business

# 2. Activate the virtual environment
source venv/bin/activate

# 3. Ensure your Azure CLI is logged in (used by DefaultAzureCredential)
az login

# 4. Set the Azure AI Foundry Project Endpoint
export AZURE_EXISTING_AIPROJECT_ENDPOINT="https://multi-agent-business.services.ai.azure.com/api/projects/multi-agent-business"

# 5. Start the server
python run.py
```

- **Web Portal**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ☁️ Deployment on Render

This project is packaged as **ONE single FastAPI web service** that serves both the API endpoints (`/chat`, `/api/health`) and the static frontend UI.

### 1. Render Service Configuration
- **Environment**: `Python 3`
- **Build Command**:
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
  ```

### 2. Required Render Environment Variables
In your Render Dashboard under **Environment**:

| Variable Name | Description / Value |
|---|---|
| `AZURE_EXISTING_AIPROJECT_ENDPOINT` | `https://multi-agent-business.services.ai.azure.com/api/projects/multi-agent-business` |
| `AZURE_TENANT_ID` | Your Microsoft Entra Tenant ID (e.g. `e2a87ce2-92f5-4e56-8914-c90ef91acf40`) |
| `AZURE_CLIENT_ID` | Microsoft Entra App / Service Principal Client ID |
| `AZURE_CLIENT_SECRET` | Microsoft Entra App / Service Principal Client Secret |

> **Note on Authentication**: On Render, `DefaultAzureCredential` uses the Service Principal environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`) to authenticate against Azure AI Foundry with zero code changes.

---

## 📡 API Endpoints

- `GET /api/health`: Validates the connection to `business-orchestrator:7` on Azure AI Foundry.
- `POST /chat`: Primary endpoint invoking the real Azure AI Foundry orchestrator.
  - Body: `{"message": "Your business query here"}`
  - Returns: Real synthesized response, real tool calls, citations, agent activity, and token usage.
- `GET /`: Serves the unified web portal.
