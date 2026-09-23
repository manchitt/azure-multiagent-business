/**
 * Azure AI Foundry Architecture Explorer
 * Provides an interactive deep-dive into each layer of the Azure Multi-Agent infrastructure.
 */

class ArchitectureExplorer {
  constructor() {
    this.layers = {
      layer1: {
        title: "Intelligence & Foundation Layer",
        service: "Azure AI Foundry • Azure OpenAI Service",
        model: "GPT-4.1-mini (Fine-tuned for A2A Speed & Structured Output)",
        description: "Serves as the computational reasoning backbone for all four agents. GPT-4.1-mini offers ultra-fast time-to-first-token (sub-180ms), 128k context window, and 88% token cost reduction compared to flagship frontier models.",
        specs: [
          { label: "Model Version", value: "GPT-4.1-mini-2025-05" },
          { label: "Context Window", value: "128,000 Tokens" },
          { label: "Token Efficiency", value: "$0.15 / 1M Input • $0.60 / 1M Output" },
          { label: "Azure Deployment", value: "Provisioned Throughput (PTU) + Global Standard" },
        ],
        codeSnippet: `# Azure AI Foundry Model Client Initialization
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

client = AIProjectClient.from_connection_string(
    conn_str="<AZURE_FOUNDRY_PROJECT_CONNECTION_STRING>",
    credential=DefaultAzureCredential()
)
model_deployment = "gpt-4.1-mini"`,
      },
      layer2: {
        title: "Multi-Agent Orchestration & A2A Mesh",
        service: "Azure AI Agent Service • A2A Direct Messaging",
        model: "Decentralized Swarm Topology with Central Orchestration Gate",
        description: "Enables direct Agent-to-Agent (A2A) peer communication. Rather than routing every micro-thought through a central bottleneck, sub-agents pass typed data payloads and invoke tools cooperatively.",
        specs: [
          { label: "Protocol", value: "A2A Event Mesh (JSON-RPC over Memory Bus)" },
          { label: "Routing Latency", value: "Sub-15ms inter-agent dispatch" },
          { label: "State Machine", value: "Deterministic handoff criteria + Loop prevention" },
          { label: "Agent Isolation", value: "Isolated containerized threads" },
        ],
        codeSnippet: `# Azure AI Agent Service A2A Connection
orchestrator = client.agents.create_agent(
    model="gpt-4.1-mini",
    name="OrchestratorAgent",
    instructions="Decompose query and coordinate Research, Analyst, Strategy agents via A2A."
)
research_agent = client.agents.create_agent(
    model="gpt-4.1-mini",
    name="ResearchAgent",
    tools=[{"type": "bing_grounding"}]
)`,
      },
      layer3: {
        title: "Tools & Dual Grounding Engine",
        service: "Bing Web Search • Azure AI Search (Hybrid Vector RAG)",
        model: "External Real-Time Web + Enterprise Internal Vector Vault",
        description: "Equips the agents with dual-mode factual grounding: real-time live market intelligence via Bing Web Search, and deep proprietary organizational grounding via Azure AI Search with semantic reranking.",
        specs: [
          { label: "Web Search", value: "Azure Bing Grounding API (Real-time Web Crawl)" },
          { label: "Vector Search", value: "Azure AI Search (HNSW + text-embedding-3-small)" },
          { label: "Semantic Reranking", value: "Cross-encoder neural reranker" },
          { label: "Citation Integrity", value: "Cryptographically linked chunk references" },
        ],
        codeSnippet: `# Azure AI Search Vector Grounding Tool Definition
from azure.ai.projects.models import VectorStoreDataSource

vector_store = client.agents.create_vector_store(
    name="EnterpriseBusinessVault",
    file_ids=["file_pitchdeck_1", "file_saas_metrics_2"]
)`,
      },
      layer4: {
        title: "Persistence & State Management",
        service: "Azure Cosmos DB • Azure Blob Storage",
        model: "Distributed NoSQL & Vector Embedding Store",
        description: "Maintains long-term agent memory, conversation threads, user audit logs, and serialized intermediate A2A states across distributed serverless nodes.",
        specs: [
          { label: "Conversation Store", value: "Azure Cosmos DB for NoSQL" },
          { label: "Consistency Level", value: "Session Consistency (Sub-5ms writes)" },
          { label: "Document Lake", value: "Azure Blob Storage (Encrypted at rest)" },
          { label: "Partition Key", value: "/tenant_id /session_id" },
        ],
        codeSnippet: `# Cosmos DB Thread Persistence
cosmos_container.upsert_item({
    "id": f"thread-{session_id}",
    "tenant_id": "enterprise-corp-01",
    "a2a_trace_count": 7,
    "last_handoff": "StrategyAgent -> OrchestratorAgent"
})`,
      },
      layer5: {
        title: "Security, Governance & Observability",
        service: "Microsoft Entra ID • Azure Key Vault • Azure Monitor",
        model: "Zero Trust Architecture with End-to-End Tracing",
        description: "Guarantees enterprise sovereignty. Managed identities authenticate all tool calls without hardcoded API keys. Application Insights captures full A2A spans and token consumption telemetry.",
        specs: [
          { label: "Identity", value: "Microsoft Entra ID Managed Identities" },
          { label: "Secrets", value: "Azure Key Vault HSM" },
          { label: "Safety Rails", value: "Azure AI Content Safety (Prompt injection & jailbreak shields)" },
          { label: "Telemetry", value: "Azure Monitor + Application Insights Tracing" },
        ],
        codeSnippet: `# Azure Content Safety & Managed Identity
from azure.identity import ManagedIdentityCredential
credential = ManagedIdentityCredential()

# Telemetry tracing spans automatically linked to Application Insights`,
      },
    };

    this.activeLayerKey = 'layer1';
    this.initEventListeners();
    this.renderActiveLayer();
  }

  initEventListeners() {
    document.querySelectorAll('[data-arch-layer]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const layerKey = btn.getAttribute('data-arch-layer');
        if (this.layers[layerKey]) {
          this.activeLayerKey = layerKey;
          this.updateNavButtons(btn);
          this.renderActiveLayer();
        }
      });
    });
  }

  updateNavButtons(activeBtn) {
    document.querySelectorAll('[data-arch-layer]').forEach(b => {
      b.classList.remove('border-sky-400', 'bg-sky-950/40', 'text-sky-300');
      b.classList.add('border-slate-800', 'bg-slate-900/40', 'text-slate-400');
    });
    activeBtn.classList.remove('border-slate-800', 'bg-slate-900/40', 'text-slate-400');
    activeBtn.classList.add('border-sky-400', 'bg-sky-950/40', 'text-sky-300');
  }

  renderActiveLayer() {
    const layer = this.layers[this.activeLayerKey];
    if (!layer) return;

    document.getElementById('arch-title').textContent = layer.title;
    document.getElementById('arch-service').textContent = layer.service;
    document.getElementById('arch-model').textContent = layer.model;
    document.getElementById('arch-description').textContent = layer.description;

    let specsHtml = '';
    layer.specs.forEach(s => {
      specsHtml += `
        <div class="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs">
          <div class="text-slate-400 font-medium mb-0.5">${s.label}</div>
          <div class="text-sky-300 font-mono font-semibold">${s.value}</div>
        </div>
      `;
    });
    document.getElementById('arch-specs-container').innerHTML = specsHtml;

    document.getElementById('arch-code-snippet').textContent = layer.codeSnippet;
  }
}

window.ArchitectureExplorer = ArchitectureExplorer;
