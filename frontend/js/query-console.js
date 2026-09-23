/**
 * Multi-Agent Query Console Controller
 * Minimal pure-black edition.
 * Calls same-origin POST /chat directly to Azure AI Foundry business-orchestrator:7.
 */

const API = "";

class QueryConsole {
  constructor() {
    this.activeResponse = null;
    this.isExecuting = false;

    // Presets
    this.presets = {
      preset1: {
        title: "Cloud AI Moat: Azure vs AWS",
        query: "Analyze Microsoft Azure AI Foundry's enterprise moat in multi-agent orchestration compared to AWS Bedrock and GCP Vertex AI. Evaluate developer adoption, GPT-4.1-mini cost efficiency, and 90-day market capture strategy.",
      },
      preset2: {
        title: "FinTech Expansion & Economics",
        query: "Formulate an expansion plan for a B2B FinTech SaaS platform launching autonomous multi-agent underwriting on Azure. Include unit economics, gross margin projections, and a 30-60-90 day execution roadmap.",
      },
      preset3: {
        title: "Enterprise Multi-Agent Due Diligence",
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
    this.citationsWrapper = document.getElementById('citations-wrapper');
  }

  initEventListeners() {
    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => this.runWorkflow());
    }

    // Keyboard shortcut: Cmd/Ctrl + Enter in textarea
    if (this.queryInput) {
      this.queryInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          this.runWorkflow();
        }
      });
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

    // Copy report button
    const copyBtn = document.getElementById('btn-copy-report');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyReport());
    }
  }

  async runWorkflow() {
    const query = this.queryInput.value.trim();
    if (!query) {
      this.queryInput.focus();
      return;
    }

    if (this.isExecuting) return;
    this.isExecuting = true;
    this.setButtonState(true);

    // Reset results view
    this.streamContainer.innerHTML = '';
    this.reportContainer.classList.add('hidden');
    this.reportPlaceholder.classList.remove('hidden');
    this.reportPlaceholder.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
        <div class="w-8 h-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div class="text-xs font-mono text-neutral-200">Executing business-orchestrator:7</div>
        <div class="text-[11px] font-mono text-neutral-600 mt-1">A2A orchestration in progress on Azure AI Foundry...</div>
      </div>
    `;

    // Step 1: Log initial dispatch
    this.appendActivityMessage({
      sender: "Client",
      recipient: "business-orchestrator",
      action: "DISPATCH",
      summary: "Query sent to Azure AI Foundry",
      detail: `Prompt: "${query.substring(0, 70)}..."`,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
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
        throw new Error(errorData.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      this.activeResponse = data;

      // Render real activity log from Azure AI Foundry
      if (data.agent_activity && data.agent_activity.length > 0) {
        this.streamContainer.innerHTML = '';
        data.agent_activity.forEach(step => this.appendActivityMessage(step));
      }

      // Render actual output
      this.renderRealResponse(data);

    } catch (err) {
      console.error("Query failed:", err);
      this.reportPlaceholder.innerHTML = `
        <div class="p-4 rounded-lg bg-neutral-950 border border-red-900/50 text-red-400 text-xs font-mono">
          <div class="font-semibold text-red-300 mb-1">Azure AI Foundry Error</div>
          <div>${this.escapeHtml(err.message)}</div>
        </div>
      `;
    } finally {
      this.isExecuting = false;
      this.setButtonState(false);
    }
  }

  appendActivityMessage(step) {
    const card = document.createElement('div');
    card.className = 'p-2.5 rounded bg-neutral-950 border border-neutral-900 text-xs font-mono transition-colors';

    let actionColor = 'text-neutral-400 border-neutral-800';
    if (step.action.includes('GROUNDING')) actionColor = 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20';
    else if (step.action.includes('SEARCH')) actionColor = 'text-sky-400 border-sky-900/40 bg-sky-950/20';
    else if (step.action.includes('SYNTHESIS')) actionColor = 'text-purple-400 border-purple-900/40 bg-purple-950/20';

    card.innerHTML = `
      <div class="flex items-center justify-between text-[11px] mb-1">
        <div class="flex items-center space-x-1.5 truncate">
          <span class="text-neutral-300 font-semibold">${step.sender}</span>
          <span class="text-neutral-600">→</span>
          <span class="text-neutral-400">${step.recipient}</span>
        </div>
        <span class="text-[10px] px-1.5 py-0.2 rounded border ${actionColor}">${step.action}</span>
      </div>
      <div class="text-[11px] text-neutral-300 font-sans mb-1">${step.summary}</div>
      <div class="text-[10px] text-neutral-500 font-mono truncate">${step.detail}</div>
    `;

    this.streamContainer.appendChild(card);
    this.streamContainer.scrollTop = this.streamContainer.scrollHeight;
  }

  renderRealResponse(data) {
    this.reportPlaceholder.classList.add('hidden');
    this.reportContainer.classList.remove('hidden');

    const usage = data.usage || {};
    if (this.tokenCounter) this.tokenCounter.textContent = (usage.total_tokens || 0).toLocaleString();
    if (this.latencyCounter) this.latencyCounter.textContent = `${usage.latency_ms || 0}ms`;

    // Actual Response Text
    const execBox = document.getElementById('rep-exec-summary');
    if (execBox) {
      execBox.textContent = data.response || 'No response returned from orchestrator.';
    }

    // Grounding Sources & Tool Calls
    const citContainer = document.getElementById('rep-citations-container');
    const citations = data.citations || [];
    const toolCalls = data.tool_calls || [];

    if (citContainer && this.citationsWrapper) {
      if (citations.length === 0 && toolCalls.length === 0) {
        this.citationsWrapper.classList.add('hidden');
      } else {
        this.citationsWrapper.classList.remove('hidden');
        citContainer.innerHTML = '';

        citations.forEach(c => {
          const item = document.createElement('div');
          item.className = 'p-2 rounded bg-neutral-950 border border-neutral-900 text-xs font-mono flex items-center justify-between';
          item.innerHTML = `
            <div class="flex items-center space-x-2 truncate">
              <span class="text-neutral-500">📄</span>
              <span class="text-neutral-300 truncate">${this.escapeHtml(c.title || 'Document')}</span>
            </div>
            <span class="text-[10px] text-neutral-600 ml-2 whitespace-nowrap">${this.escapeHtml(c.type || 'Grounding')}</span>
          `;
          citContainer.appendChild(item);
        });

        toolCalls.forEach(t => {
          const item = document.createElement('div');
          item.className = 'p-2 rounded bg-neutral-950 border border-neutral-900 text-xs font-mono flex items-center justify-between';
          item.innerHTML = `
            <div class="flex items-center space-x-2 truncate">
              <span class="text-neutral-500">⚙️</span>
              <span class="text-neutral-300">${this.escapeHtml(t.type)}</span>
              ${t.queries ? `<span class="text-neutral-500 text-[11px] truncate">(${this.escapeHtml(t.queries.join(', '))})</span>` : ''}
            </div>
            <span class="text-[10px] text-emerald-500 font-semibold">${t.status}</span>
          `;
          citContainer.appendChild(item);
        });
      }
    }
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

  copyReport() {
    if (!this.activeResponse) return;
    navigator.clipboard.writeText(this.activeResponse.response || '').then(() => {
      const copyBtn = document.getElementById('btn-copy-report');
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 1500);
      }
    });
  }

  setButtonState(loading) {
    if (loading) {
      this.runBtn.disabled = true;
      this.runBtn.classList.add('opacity-50', 'cursor-not-allowed');
      this.runBtn.innerHTML = `
        <span class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
        <span>Executing...</span>
      `;
    } else {
      this.runBtn.disabled = false;
      this.runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      this.runBtn.innerHTML = `
        <span>Run Multi-Agent Workflow</span>
        <span>↵</span>
      `;
    }
  }
}

window.QueryConsole = QueryConsole;
