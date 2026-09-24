"""Test script verifying real Azure AI Foundry integration endpoints."""
import asyncio
from backend.app.main import health, chat, ChatMessageRequest

async def main():
    print("Testing GET /api/health...")
    h = await health()
    print("Health response:", h)
    assert h["status"] == "healthy"
    assert h["agent"] == "business-orchestrator"
    assert h["app_name"] == "MULTI AGENT BUSINESS ASSISTANT"
    print("✓ GET /api/health passed!\n")

    print("Testing Guardrail with off-topic non-business query...")
    req_offtopic = ChatMessageRequest(message="Give me a chocolate chip cookie recipe")
    res_offtopic = await chat(req_offtopic)
    print("Guardrail response:")
    print("  Triggered:", res_offtopic.get("guardrail_triggered"))
    print("  Reason:", res_offtopic.get("guardrail_reason"))
    print("  Response:", res_offtopic.get("response"))
    assert res_offtopic.get("guardrail_triggered") is True
    print("✓ Guardrail successfully blocked off-topic request!\n")

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
    print(res.get("response")[:400] + "...")
    print("-" * 40)
    print("  Agent Activity count:", len(res.get("agent_activity", [])))
    print("  Tool Calls count:", len(res.get("tool_calls", [])))
    print("  Citations count:", len(res.get("citations", [])))

    assert res.get("status") == "completed"
    assert len(res.get("response", "")) > 0
    print("✓ Live query completed successfully!\n")

    print("Testing instant cache hit on repeated query...")
    res_cached = await chat(req)
    print("Cached response latency:", res_cached.get("usage", {}).get("latency_ms"), "ms")
    print("Cached flag:", res_cached.get("cached"))
    assert res_cached.get("cached") is True
    assert res_cached.get("usage", {}).get("latency_ms") == 0
    print("✓ Instant cache hit (0ms) verified successfully!\n")

    print("\n🎉 ALL REAL AZURE AI FOUNDRY ENDPOINTS, GUARDRAILS & CACHE VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())
