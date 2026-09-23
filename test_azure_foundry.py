"""Test script verifying real Azure AI Foundry integration endpoints."""
import asyncio
from backend.app.main import health, chat, ChatMessageRequest

async def main():
    print("Testing GET /api/health...")
    h = await health()
    print("Health response:", h)
    assert h["status"] == "healthy"
    assert h["agent"] == "business-orchestrator"
    print("✓ GET /api/health passed!\n")

    print("Testing POST /chat with real Azure AI Foundry Orchestrator...")
    req = ChatMessageRequest(message="What are the top 3 considerations for enterprise multi-agent deployment on Azure?")
    res = await chat(req)
    print("Chat response received:")
    print("  Orchestrator:", res.get("orchestrator"))
    print("  Version:", res.get("version"))
    print("  Model:", res.get("model"))
    print("  Status:", res.get("status"))
    print("  Usage:", res.get("usage"))
    print("  Response text:\n" + ("-" * 40))
    print(res.get("response"))
    print("-" * 40)
    print("  Agent Activity count:", len(res.get("agent_activity", [])))
    print("  Tool Calls count:", len(res.get("tool_calls", [])))
    print("  Citations count:", len(res.get("citations", [])))

    assert res.get("status") == "completed"
    assert len(res.get("response", "")) > 0
    print("\n🎉 ALL REAL AZURE AI FOUNDRY ENDPOINTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())
