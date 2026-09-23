/**
 * MULTI AGENT BUSINESS ASSISTANT — ChatGPT-Style Pure Black Controller
 * Connects directly to same-origin POST /chat (Azure AI Foundry business-orchestrator:7)
 */

const API = "";

class ChatApp {
  constructor() {
    this.messages = [];
    this.isGenerating = false;
    this.history = this.loadHistory();

    // Starter prompts
    this.starters = {
      preset1: "Analyze Microsoft Azure AI Foundry's enterprise moat in multi-agent orchestration compared to AWS Bedrock and GCP Vertex AI. Evaluate developer adoption, GPT-4.1-mini cost efficiency, and 90-day market capture strategy.",
      preset2: "Formulate an expansion plan for a B2B FinTech SaaS platform launching autonomous multi-agent underwriting on Azure. Include unit economics, gross margin projections, and a 30-60-90 day execution roadmap.",
      preset3: "Perform strategic due diligence and ROI modeling for replacing legacy enterprise business consulting with an Azure AI Foundry 4-agent autonomous swarm. Benchmarking cost savings, speed multipliers, and compliance.",
      preset4: "Evaluate market sizing (CAGR), top 3 competitor vulnerabilities, and 90-day execution roadmaps for AI-powered autonomous enterprise operations in 2026.",
    };

    this.initElements();
    this.initEventListeners();
    this.renderHistory();
  }

  initElements() {
    this.chatInput = document.getElementById('chat-input');
    this.btnSend = document.getElementById('btn-send');
    this.emptyState = document.getElementById('empty-state');
    this.messagesContainer = document.getElementById('messages-container');
    this.scrollArea = document.getElementById('chat-scroll-area');
    this.btnNewChat = document.getElementById('btn-new-chat');
    this.btnClearChat = document.getElementById('btn-clear-chat');
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    this.sidebar = document.getElementById('chat-sidebar');
    this.historyList = document.getElementById('chat-history-list');
  }

  initEventListeners() {
    // Send button
    if (this.btnSend) {
      this.btnSend.addEventListener('click', () => this.sendMessage());
    }

    // Textarea input & auto-resize
    if (this.chatInput) {
      this.chatInput.addEventListener('input', () => {
        this.autoResizeInput();
        this.updateSendButtonState();
      });

      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Starter prompt cards
    document.querySelectorAll('[data-starter]').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-starter');
        if (this.starters[key]) {
          this.chatInput.value = this.starters[key];
          this.autoResizeInput();
          this.updateSendButtonState();
          this.sendMessage();
        }
      });
    });

    // New Chat & Clear
    if (this.btnNewChat) {
      this.btnNewChat.addEventListener('click', () => this.resetChat());
    }
    if (this.btnClearChat) {
      this.btnClearChat.addEventListener('click', () => this.resetChat());
    }

    // Sidebar Toggle (Mobile / Desktop)
    if (this.btnToggleSidebar && this.sidebar) {
      this.btnToggleSidebar.addEventListener('click', () => {
        this.sidebar.classList.toggle('hidden');
      });
    }

    // Keyboard shortcut Cmd/Ctrl + K for New Chat
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.resetChat();
      }
    });
  }

  autoResizeInput() {
    if (!this.chatInput) return;
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 180)}px`;
  }

  updateSendButtonState() {
    const text = this.chatInput.value.trim();
    if (text && !this.isGenerating) {
      this.btnSend.disabled = false;
      this.btnSend.classList.remove('opacity-30', 'cursor-not-allowed');
      this.btnSend.classList.add('opacity-100', 'cursor-pointer');
    } else {
      this.btnSend.disabled = true;
      this.btnSend.classList.add('opacity-30', 'cursor-not-allowed');
      this.btnSend.classList.remove('opacity-100', 'cursor-pointer');
    }
  }

  resetChat() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
    this.messagesContainer.classList.add('hidden');
    this.emptyState.classList.remove('hidden');
    if (this.chatInput) {
      this.chatInput.value = '';
      this.autoResizeInput();
      this.updateSendButtonState();
      this.chatInput.focus();
    }
  }

  async sendMessage() {
    const prompt = this.chatInput.value.trim();
    if (!prompt || this.isGenerating) return;

    this.isGenerating = true;
    this.updateSendButtonState();

    // Transition from empty state to conversation view
    this.emptyState.classList.add('hidden');
    this.messagesContainer.classList.remove('hidden');

    // 1. Render User Message
    this.appendUserMessage(prompt);
    this.saveToHistory(prompt);

    // Clear input
    this.chatInput.value = '';
    this.autoResizeInput();

    // 2. Render Temporary Assistant Loading Bubble
    const assistantRowId = `msg-${Date.now()}`;
    this.appendAssistantLoadingBubble(assistantRowId);
    this.scrollToBottom();

    try {
      // Direct call to same-origin POST /chat
      const resp = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      
      // Update assistant bubble with real Azure AI Foundry response
      this.updateAssistantBubbleWithRealData(assistantRowId, data);

    } catch (err) {
      console.error("Chat error:", err);
      this.renderAssistantError(assistantRowId, err.message);
    } finally {
      this.isGenerating = false;
      this.updateSendButtonState();
      this.scrollToBottom();
    }
  }

  appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row flex justify-end';
    row.innerHTML = `
      <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 bg-[#1C1C1F] text-neutral-100 text-sm leading-relaxed border border-neutral-800 whitespace-pre-wrap">
        ${this.escapeHtml(text)}
      </div>
    `;
    this.messagesContainer.appendChild(row);
  }

  appendAssistantLoadingBubble(rowId) {
    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'message-row flex items-start space-x-3 text-neutral-300';
    row.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
        ⚡
      </div>
      <div class="flex-1 space-y-3 min-w-0">
        <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-900 text-xs font-mono text-neutral-400">
          <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          <span>Orchestrating agents (Orchestrator ➔ Research ➔ Analyst ➔ Strategy)...</span>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(row);
  }

  updateAssistantBubbleWithRealData(rowId, data) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const usage = data.usage || {};
    const steps = data.agent_activity || [];
    const citations = data.citations || [];
    const toolCalls = data.tool_calls || [];

    // Build Thought Process Accordion
    let stepsHtml = '';
    if (steps.length > 0) {
      stepsHtml = `
        <details class="group mb-3 border border-neutral-900 rounded-lg bg-[#08080A] text-xs font-mono">
          <summary class="p-2.5 cursor-pointer flex items-center justify-between text-neutral-400 hover:text-neutral-200 select-none">
            <span class="flex items-center space-x-2">
              <span class="text-emerald-500 font-bold">✓</span>
              <span>Multi-Agent Orchestration (${steps.length} steps completed)</span>
            </span>
            <span class="text-neutral-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="p-3 pt-0 space-y-1.5 border-t border-neutral-900/60 mt-1">
            ${steps.map(s => `
              <div class="flex items-start justify-between py-1 text-[11px]">
                <div class="truncate mr-2">
                  <span class="text-neutral-400 font-semibold">${s.sender}</span>
                  <span class="text-neutral-600">→</span>
                  <span class="text-neutral-300">${s.recipient}</span>:
                  <span class="text-neutral-500 font-sans ml-1">${this.escapeHtml(s.summary)}</span>
                </div>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 shrink-0">${s.action}</span>
              </div>
            `).join('')}
          </div>
        </details>
      `;
    }

    // Build Citations & Tools Chips
    let sourcesHtml = '';
    if (citations.length > 0 || toolCalls.length > 0) {
      sourcesHtml = `
        <div class="mt-3 pt-3 border-t border-neutral-900/80 flex flex-wrap gap-2 text-[11px] font-mono">
          ${citations.map(c => `
            <span class="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 flex items-center space-x-1">
              <span>📄</span>
              <span class="truncate max-w-[200px]" title="${c.title}">${this.escapeHtml(c.title)}</span>
            </span>
          `).join('')}
          ${toolCalls.map(t => `
            <span class="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 flex items-center space-x-1">
              <span>⚙️</span>
              <span>${this.escapeHtml(t.type)}</span>
            </span>
          `).join('')}
        </div>
      `;
    }

    row.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
        ⚡
      </div>
      <div class="flex-1 space-y-2 min-w-0">
        <!-- Orchestrator Step Accordion -->
        ${stepsHtml}

        <!-- Real Synthesized Output from Azure AI Foundry -->
        <div class="prose-chat whitespace-pre-wrap leading-relaxed">
          ${this.escapeHtml(data.response || 'No response returned.')}
        </div>

        <!-- Grounded Sources -->
        ${sourcesHtml}

        <!-- Action / Metadata bar -->
        <div class="flex items-center justify-between pt-2 text-[11px] font-mono text-neutral-500">
          <div class="flex items-center space-x-3">
            <span>Tokens: ${usage.total_tokens || 0}</span>
            <span>Latency: ${usage.latency_ms || 0}ms</span>
            <span>Model: ${data.model || 'gpt-4.1-mini'}</span>
          </div>
          <button class="btn-copy px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors" data-copy="${encodeURIComponent(data.response || '')}">
            Copy
          </button>
        </div>
      </div>
    `;

    // Attach copy handler
    const copyBtn = row.querySelector('.btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = decodeURIComponent(copyBtn.getAttribute('data-copy'));
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 1500);
        });
      });
    }
  }

  renderAssistantError(rowId, errMsg) {
    const row = document.getElementById(rowId);
    if (!row) return;

    row.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center font-bold text-xs text-red-200 shrink-0 mt-0.5">
        !
      </div>
      <div class="flex-1 min-w-0">
        <div class="p-3 rounded-lg bg-red-950/30 border border-red-900/60 text-xs font-mono text-red-400">
          <div class="font-bold text-red-300 mb-1">Azure AI Foundry Error</div>
          <div>${this.escapeHtml(errMsg)}</div>
        </div>
      </div>
    `;
  }

  scrollToBottom() {
    if (this.scrollArea) {
      this.scrollArea.scrollTop = this.scrollArea.scrollHeight;
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

  loadHistory() {
    try {
      const stored = localStorage.getItem('maba_chat_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveToHistory(prompt) {
    this.history.unshift({ text: prompt, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (this.history.length > 20) this.history = this.history.slice(0, 20);
    try {
      localStorage.setItem('maba_chat_history', JSON.stringify(this.history));
    } catch {}
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyList) return;
    this.historyList.innerHTML = '';

    if (this.history.length === 0) {
      this.historyList.innerHTML = `
        <div class="px-2 py-4 text-[11px] text-neutral-600 font-mono italic">No recent chats yet</div>
      `;
      return;
    }

    this.history.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-900 text-xs text-neutral-400 hover:text-neutral-200 truncate transition-colors font-sans block';
      btn.textContent = item.text;
      btn.title = item.text;
      btn.addEventListener('click', () => {
        if (this.chatInput) {
          this.chatInput.value = item.text;
          this.autoResizeInput();
          this.updateSendButtonState();
          this.sendMessage();
        }
      });
      this.historyList.appendChild(btn);
    });
  }
}

window.ChatApp = ChatApp;
