/**
 * Multi-Agent Query Console Controller
 * Connects directly to real Azure AI Foundry business-orchestrator via same-origin POST /chat.
 * Displays the actual response, real tool calls, real citations, and real token telemetry.
 */

// Same-origin API configuration (no hardcoded localhost or tunnel URLs)
const API = "";

class QueryConsole {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.activeResponse = null;
    this.isExecuting = false;

    // Presets for quick executive prompts
    this.presets = {
      preset1: {
        title: "Cloud AI Moat: Azure AI Foundry vs AWS Bedrock & GCP Vertex AI",
        query: "Analyze Microsoft Azure AI Foundry's enterprise moat in multi-agent orchestration compared to AWS Bedrock and GCP Vertex AI. Evaluate developer adoption, GPT-4.1-mini cost efficiency, and 90-day market capture strategy.",
      },
      preset2: {
        title: "B2B SaaS FinTech Expansion: Unit Economics & Go-to-Market",
        query: "Formulate an expansion plan for a B2B FinTech SaaS platform launching autonomous multi-agent underwriting on Azure. Include unit economics, gross margin projections, and a 30-60-90 day execution roadmap.",
      },
      preset3: {
        title: "Enterprise Autonomous Workforce ROI & Due Diligence",
        query: "Perform strategic due diligence and ROI modeling for replacing legacy enterprise business consulting with an Azure AI Foundry 4-agent autonomous swarm. Benchmarking cost savings, speed multipliers, and compliance.",
      },
    };

    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.queryInput = document.getElementById('business-query-input');
    this.runBtn = document.getElementById('run-orchestration-btn');
    this.streamContainer = document.getElementById('a2a-stream-container');
    this.reportContainer = document.getElementById('report-container');
    this.reportPlaceholder = document.getElementById('report-placeholder');
    this.tokenCounter = document.getElementById('telemetry-tokens');
    this.latencyCounter = document.getElementById('telemetry-latency');
    this.costCounter = document.getElementById('telemetry-cost');
  }

  initEventListeners() {
    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => this.runWorkflow());
    }

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pKey = btn.getAttribute('data-preset');
        if (this.presets[pKey]) {
          this.queryInput.value = this.presets[pKey].query;
          this.queryInput.focus();
        }
      });
    });

    // Tab buttons inside report
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-report-tab]');
      if (tabBtn) {
        const tabTarget = tabBtn.getAttribute('data-report-tab');
        this.switchReportTab(tabTarget, tabBtn);
      }
    });

    // Copy button
    const copyBtn = document.getElementById('btn-copy-report');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyReport());
    }
  }

  async runWorkflow() {
    const query = this.queryInput.value.trim();
    if (!query) {
      alert("Please enter a business query or select a preset scenario.");
      return;
    }

    if (this.isExecuting) return;
    this.isExecuting = true;
    this.setButtonState(true);

    // Reset UI
    this.streamContainer.innerHTML = '';
    this.reportContainer.classList.add('hidden');
    this.reportPlaceholder.classList.remove('hidden');
    this.reportPlaceholder.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-sky-300 font-semibold text-lg">Calling Azure AI Foundry business-orchestrator:7</div>
        <div class="text-slate-400 text-sm mt-1">Executing real Multi-Agent A2A coordination via Azure AI Projects SDK...</div>
      </div>
    `;

    // Visualizer animation
    if (this.visualizer) {
      this.visualizer.setActiveAgent('agent-orchestrator');
      this.visualizer.triggerA2AHandoff('agent-orchestrator', 'agent-research', 12);
    }

    // Add initial step to activity feed
    this.appendActivityMessage({
      sender: "User",
      recipient: "business-orchestrator (v7)",
      action: "DISPATCH",
      summary: "Transmitting inquiry to Azure AI Foundry Orchestrator",
      detail: `POST ${API}/chat with model 'gpt-4.1-mini'`,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      // POST to same-origin /chat endpoint
      const resp = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(errorData.detail || `Server returned HTTP ${resp.status}`);
      }

      const realData = await resp.json();
      this.activeResponse = realData;

      // Render the real agent activity steps from Azure Foundry
      if (realData.agent_activity && realData.agent_activity.length > 0) {
        this.streamContainer.innerHTML = '';
        for (const step of realData.agent_activity) {
          this.appendActivityMessage(step);
          if (step.action.includes('GROUNDING') && this.visualizer) {
            this.visualizer.triggerA2AHandoff('agent-analyst', 'tool-filesearch', 10);
          } else if (step.action.includes('SEARCH') && this.visualizer) {
            this.visualizer.triggerA2AHandoff('agent-research', 'tool-websearch', 10);
          }
        }
      }

      // Display the actual response returned by Azure AI Foundry
      this.renderRealResponse(query, realData);

    } catch (err) {
      console.error("Chat execution error:", err);
      this.reportPlaceholder.innerHTML = `
        <div class="p-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          <div class="font-bold text-sm mb-1 text-rose-200">Azure AI Foundry Orchestrator Error</div>
          <div class="font-mono mb-3 whitespace-pre-wrap">${err.message}</div>
          <div class="text-[11px] text-slate-400">Ensure your AZURE_EXISTING_AIPROJECT_ENDPOINT is set and valid Azure credentials are provided.</div>
        </div>
      `;
    } finally {
      this.isExecuting = false;
      this.setButtonState(false);
      if (this.visualizer) {
        this.visualizer.setActiveAgent(null);
      }
    }
  }

  appendActivityMessage(step) {
    const card = document.createElement('div');
    card.className = 'p-3 rounded-lg border border-slate-800 bg-slate-900/60 mb-2 transition-all hover:border-slate-700';

    let badgeClass = 'bg-sky-900/60 text-sky-300 border-sky-700';
    if (step.action.includes('GROUNDING')) badgeClass = 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
    else if (step.action.includes('SEARCH')) badgeClass = 'bg-blue-900/60 text-blue-300 border-blue-700';
    else if (step.action.includes('SYNTHESIS')) badgeClass = 'bg-purple-900/60 text-purple-300 border-purple-700';

    card.innerHTML = `
      <div class="flex items-center justify-between text-xs mb-1.5">
        <div class="flex items-center space-x-2">
          <span class="font-semibold text-slate-200">${step.sender}</span>
          <span class="text-slate-500">→</span>
          <span class="text-slate-300">${step.recipient}</span>
          <span class="px-2 py-0.5 text-[10px] rounded border ${badgeClass}">${step.action}</span>
        </div>
        <span class="text-slate-500 font-mono text-[10px]">${step.timestamp || ''}</span>
      </div>
      <div class="text-xs font-medium text-slate-300 mb-1">${step.summary}</div>
      <div class="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-900 font-mono whitespace-pre-wrap">${step.detail}</div>
    `;
    this.streamContainer.appendChild(card);
    this.streamContainer.scrollTop = this.streamContainer.scrollHeight;
  }

  renderRealResponse(query, data) {
    this.reportPlaceholder.classList.add('hidden');
    this.reportContainer.classList.remove('hidden');

    const usage = data.usage || {};
    if (this.tokenCounter) this.tokenCounter.textContent = (usage.total_tokens || 0).toLocaleString();
    if (this.latencyCounter) this.latencyCounter.textContent = `${usage.latency_ms || 0}ms`;
    if (this.costCounter) this.costCounter.textContent = `$${usage.estimated_cost_usd || 0}`;

    // Fill Executive Summary / Real Output
    document.getElementById('rep-query-title').textContent = query;
    document.getElementById('rep-timestamp').textContent = new Date().toUTCString();
    
    // Display the ACTUAL text returned by Azure AI Foundry
    const execBox = document.getElementById('rep-exec-summary');
    if (execBox) {
      execBox.innerHTML = `
        <div class="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
          ${this.escapeHtml(data.response || 'No response text returned.')}
        </div>
      `;
    }

    // Render Citations & Tool Grounding
    const citContainer = document.getElementById('rep-citations-container');
    if (citContainer) {
      citContainer.innerHTML = '';
      const citations = data.citations || [];
      const toolCalls = data.tool_calls || [];

      if (citations.length === 0 && toolCalls.length === 0) {
        citContainer.innerHTML = `
          <div class="text-xs text-slate-400 italic p-3 rounded bg-slate-900 border border-slate-800">
            No external document annotations or tool calls attached to this specific response.
          </div>
        `;
      } else {
        citations.forEach(c => {
          const item = document.createElement('div');
          item.className = 'p-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 text-xs mb-2';
          item.innerHTML = `
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold text-emerald-300">📄 ${this.escapeHtml(c.title || 'Document')}</span>
              <span class="px-2 py-0.5 rounded bg-emerald-900/60 text-[10px] text-emerald-200">${c.type}</span>
            </div>
            <div class="text-slate-400 font-mono text-[10px]">${this.escapeHtml(c.source || '')}</div>
          `;
          citContainer.appendChild(item);
        });

        toolCalls.forEach(t => {
          const item = document.createElement('div');
          item.className = 'p-3 rounded-lg border border-sky-800/40 bg-sky-950/20 text-xs mb-2';
          item.innerHTML = `
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold text-sky-300">⚙️ ${this.escapeHtml(t.type)}</span>
              <span class="px-2 py-0.5 rounded bg-sky-900/60 text-[10px] text-sky-200">${t.status}</span>
            </div>
            ${t.queries ? `<div class="text-slate-400 font-mono text-[10px]">Queries: ${this.escapeHtml(t.queries.join(', '))}</div>` : ''}
          `;
          citContainer.appendChild(item);
        });
      }
    }

    // Scroll report into view
    this.reportContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  switchReportTab(targetTab, clickedBtn) {
    document.querySelectorAll('[data-report-tab]').forEach(b => b.classList.remove('tab-active'));
    clickedBtn.classList.add('tab-active');

    document.querySelectorAll('.report-tab-pane').forEach(pane => pane.classList.add('hidden'));
    const targetPane = document.getElementById(`tab-pane-${targetTab}`);
    if (targetPane) targetPane.classList.remove('hidden');
  }

  copyReport() {
    if (!this.activeResponse) return;
    const text = `
=== AZURE AI FOUNDRY MULTI-AGENT ASSISTANT RESPONSE ===
Query: ${this.queryInput.value}
Agent: ${this.activeResponse.orchestrator} (v${this.activeResponse.version})
Model: ${this.activeResponse.model}

RESPONSE:
${this.activeResponse.response}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      alert("Real Azure AI Foundry response copied to clipboard!");
    });
  }

  setButtonState(loading) {
    if (loading) {
      this.runBtn.disabled = true;
      this.runBtn.innerHTML = `
        <span class="flex items-center justify-center space-x-2">
          <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Calling Azure Foundry...</span>
        </span>
      `;
    } else {
      this.runBtn.disabled = false;
      this.runBtn.innerHTML = `
        <span class="flex items-center justify-center space-x-2">
          <span>Run Multi-Agent Workflow</span>
          <span class="text-base">⚡</span>
        </span>
      `;
    }
  }
}

window.QueryConsole = QueryConsole;
