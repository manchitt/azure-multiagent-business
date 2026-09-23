/**
 * MULTI AGENT BUSINESS ASSISTANT — ChatGPT-Style Controller
 * Features:
 * 1. Live Voice Search (Web Speech API)
 * 2. Persistent Multi-Turn Chat History in Recents (Full Conversation Recall)
 * 3. Direct integration with same-origin POST /chat (Azure AI Foundry business-orchestrator:7)
 */

const API = "";

class ChatApp {
  constructor() {
    this.conversations = this.loadConversations();
    this.activeConversationId = null;
    this.isGenerating = false;
    this.isListening = false;
    this.recognition = null;

    // Starter Prompts
    this.starters = {
      preset1: "Analyze Microsoft Azure AI Foundry's enterprise moat in multi-agent orchestration compared to AWS Bedrock and GCP Vertex AI. Evaluate developer adoption, GPT-4.1-mini cost efficiency, and 90-day market capture strategy.",
      preset2: "Formulate an expansion plan for a B2B FinTech SaaS platform launching autonomous multi-agent underwriting on Azure. Include unit economics, gross margin projections, and a 30-60-90 day execution roadmap.",
      preset3: "Perform strategic due diligence and ROI modeling for replacing legacy enterprise business consulting with an Azure AI Foundry 4-agent autonomous swarm. Benchmarking cost savings, speed multipliers, and compliance.",
      preset4: "Evaluate market sizing (CAGR), top 3 competitor vulnerabilities, and 90-day execution roadmaps for AI-powered autonomous enterprise operations in 2026.",
    };

    this.initElements();
    this.initEventListeners();
    this.initVoiceSearch();
    this.renderHistory();
  }

  initElements() {
    this.chatInput = document.getElementById('chat-input');
    this.btnSend = document.getElementById('btn-send');
    this.btnVoice = document.getElementById('btn-voice-search');
    this.voiceBanner = document.getElementById('voice-status-banner');
    this.btnCancelVoice = document.getElementById('btn-cancel-voice');
    this.emptyState = document.getElementById('empty-state');
    this.messagesContainer = document.getElementById('messages-container');
    this.scrollArea = document.getElementById('chat-scroll-area');
    this.btnNewChat = document.getElementById('btn-new-chat');
    this.btnClearChat = document.getElementById('btn-clear-chat');
    this.btnClearAllHistory = document.getElementById('btn-clear-all-history');
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    this.sidebar = document.getElementById('chat-sidebar');
    this.historyList = document.getElementById('chat-history-list');
  }

  initEventListeners() {
    // Send button
    if (this.btnSend) {
      this.btnSend.addEventListener('click', () => this.sendMessage());
    }

    // Input auto-resizing & Enter key
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

    // New Chat & Clear View
    if (this.btnNewChat) {
      this.btnNewChat.addEventListener('click', () => this.startNewChat());
    }
    if (this.btnClearChat) {
      this.btnClearChat.addEventListener('click', () => this.startNewChat());
    }

    // Clear All History
    if (this.btnClearAllHistory) {
      this.btnClearAllHistory.addEventListener('click', () => {
        if (confirm("Clear all saved chat history?")) {
          this.conversations = [];
          this.saveConversations();
          this.startNewChat();
          this.renderHistory();
        }
      });
    }

    // Toggle Sidebar
    if (this.btnToggleSidebar && this.sidebar) {
      this.btnToggleSidebar.addEventListener('click', () => {
        this.sidebar.classList.toggle('hidden');
      });
    }

    // Keyboard shortcut Cmd/Ctrl + K for New Chat
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.startNewChat();
      }
    });
  }

  /* ==================== VOICE SEARCH FEATURE ==================== */
  initVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (this.btnVoice) {
        this.btnVoice.title = "Voice recognition is not supported in this browser (use Chrome, Edge, or Safari).";
        this.btnVoice.classList.add("opacity-40");
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.initialInputText = "";

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.btnVoice) this.btnVoice.classList.add('mic-active');
      if (this.voiceBanner) {
        this.voiceBanner.classList.remove('hidden');
        this.voiceBanner.innerHTML = `
          <span class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Listening... Speak your business inquiry.</span>
          </span>
          <button id="btn-cancel-voice" class="text-neutral-500 hover:text-neutral-300 text-[11px]">Done</button>
        `;
        const cancelBtn = this.voiceBanner.querySelector('#btn-cancel-voice');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.stopVoiceListening());
      }
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const spoken = (finalTranscript + interimTranscript).trim();
      if (this.chatInput && spoken) {
        const combined = this.initialInputText ? `${this.initialInputText} ${spoken}` : spoken;
        this.chatInput.value = combined;
        this.autoResizeInput();
        this.updateSendButtonState();
      }
    };

    this.recognition.onerror = (event) => {
      console.warn("Voice search error:", event.error);
      if (event.error === 'not-allowed') {
        if (this.voiceBanner) {
          this.voiceBanner.classList.remove('hidden');
          this.voiceBanner.innerHTML = `
            <span class="text-red-400">Microphone permission blocked. Click the lock/tune icon in your address bar to allow.</span>
            <button id="btn-dismiss-mic" class="text-neutral-500 hover:text-neutral-300 text-[11px] ml-2">Dismiss</button>
          `;
          const dBtn = this.voiceBanner.querySelector('#btn-dismiss-mic');
          if (dBtn) dBtn.addEventListener('click', () => this.voiceBanner.classList.add('hidden'));
        }
      }
      this.stopVoiceListening();
    };

    this.recognition.onend = () => {
      this.stopVoiceListening();
    };

    // Voice button click handler (toggle)
    if (this.btnVoice) {
      this.btnVoice.addEventListener('click', () => {
        if (this.isListening) {
          this.stopVoiceListening();
        } else {
          this.startVoiceListening();
        }
      });
    }

    if (this.btnCancelVoice) {
      this.btnCancelVoice.addEventListener('click', () => {
        this.stopVoiceListening();
      });
    }
  }

  startVoiceListening() {
    if (!this.recognition) return;
    this.initialInputText = this.chatInput ? this.chatInput.value.trim() : '';
    try {
      this.recognition.start();
    } catch (e) {
      this.stopVoiceListening();
    }
  }

  stopVoiceListening() {
    this.isListening = false;
    if (this.btnVoice) this.btnVoice.classList.remove('mic-active');
    if (this.voiceBanner) this.voiceBanner.classList.add('hidden');
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
    if (this.chatInput) {
      this.chatInput.focus();
    }
  }

  /* ==================== CHAT ACTIONS & API ==================== */
  autoResizeInput() {
    if (!this.chatInput) return;
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 180)}px`;
  }

  updateSendButtonState() {
    const text = this.chatInput ? this.chatInput.value.trim() : '';
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

  startNewChat() {
    this.stopVoiceListening();
    this.activeConversationId = null;
    this.messagesContainer.innerHTML = '';
    this.messagesContainer.classList.add('hidden');
    this.emptyState.classList.remove('hidden');
    if (this.chatInput) {
      this.chatInput.value = '';
      this.autoResizeInput();
      this.updateSendButtonState();
      this.chatInput.focus();
    }
    this.renderHistory();
  }

  async sendMessage() {
    const prompt = this.chatInput.value.trim();
    if (!prompt || this.isGenerating) return;

    this.stopVoiceListening();
    this.isGenerating = true;
    this.updateSendButtonState();

    // Ensure we have an active conversation
    if (!this.activeConversationId) {
      const newConv = {
        id: `conv_${Date.now()}`,
        title: prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt,
        timestamp: Date.now(),
        messages: [],
      };
      this.conversations.unshift(newConv);
      this.activeConversationId = newConv.id;
    }

    const currentConv = this.conversations.find(c => c.id === this.activeConversationId);

    // Transition from empty state to conversation view
    this.emptyState.classList.add('hidden');
    this.messagesContainer.classList.remove('hidden');

    // 1. Render User Message
    this.appendUserMessage(prompt);
    if (currentConv) {
      currentConv.messages.push({ role: 'user', content: prompt });
      this.saveConversations();
      this.renderHistory();
    }

    // Clear input
    this.chatInput.value = '';
    this.autoResizeInput();

    // 2. Render Temporary Assistant Loading Bubble
    const assistantRowId = `msg-${Date.now()}`;
    this.appendAssistantLoadingBubble(assistantRowId);
    this.scrollToBottom();

    try {
      // Call same-origin POST /chat
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

      // Save assistant response to conversation history
      if (currentConv) {
        currentConv.messages.push({ role: 'assistant', data: data });
        this.saveConversations();
      }

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
      <div class="w-7 h-7 rounded-lg bg-[#141416] border border-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
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
      <div class="w-7 h-7 rounded-lg bg-[#141416] border border-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
        ⚡
      </div>
      <div class="flex-1 space-y-2 min-w-0">
        <!-- Orchestrator Step Accordion -->
        ${stepsHtml}

        <!-- Real Output from Azure AI Foundry -->
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
          <button class="btn-copy px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer" data-copy="${encodeURIComponent(data.response || '')}">
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

  /* ==================== MULTI-SESSION CHAT HISTORY ==================== */
  loadConversations() {
    try {
      const stored = localStorage.getItem('maba_full_conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveConversations() {
    try {
      localStorage.setItem('maba_full_conversations', JSON.stringify(this.conversations));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }

  loadConversationById(convId) {
    const conv = this.conversations.find(c => c.id === convId);
    if (!conv) return;

    this.activeConversationId = conv.id;
    this.emptyState.classList.add('hidden');
    this.messagesContainer.classList.remove('hidden');
    this.messagesContainer.innerHTML = '';

    // Replay all messages in this conversation
    conv.messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        this.appendUserMessage(msg.content);
      } else if (msg.role === 'assistant') {
        const rowId = `history-row-${idx}-${Date.now()}`;
        const row = document.createElement('div');
        row.id = rowId;
        row.className = 'message-row flex items-start space-x-3 text-neutral-300';
        this.messagesContainer.appendChild(row);
        this.updateAssistantBubbleWithRealData(rowId, msg.data);
      }
    });

    this.renderHistory();
    this.scrollToBottom();
  }

  deleteConversation(convId, event) {
    if (event) event.stopPropagation();
    this.conversations = this.conversations.filter(c => c.id !== convId);
    this.saveConversations();

    if (this.activeConversationId === convId) {
      this.startNewChat();
    } else {
      this.renderHistory();
    }
  }

  renderHistory() {
    if (!this.historyList) return;
    this.historyList.innerHTML = '';

    if (this.conversations.length === 0) {
      this.historyList.innerHTML = `
        <div class="px-2 py-6 text-[11px] text-neutral-600 font-mono italic text-center">No saved chats</div>
      `;
      return;
    }

    this.conversations.forEach(conv => {
      const isActive = this.activeConversationId === conv.id;
      const item = document.createElement('div');
      item.className = `group flex items-center justify-between px-2.5 py-1.5 rounded text-xs border border-transparent transition-all cursor-pointer ${
        isActive ? 'chat-history-active' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
      }`;

      item.innerHTML = `
        <div class="truncate mr-2 flex-1">
          <div class="truncate text-xs font-sans">${this.escapeHtml(conv.title)}</div>
          <div class="text-[9px] text-neutral-600 font-mono mt-0.5">${new Date(conv.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
        </div>
        <button class="btn-del-conv opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-opacity" title="Delete chat">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      `;

      item.addEventListener('click', () => {
        this.loadConversationById(conv.id);
      });

      const delBtn = item.querySelector('.btn-del-conv');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          this.deleteConversation(conv.id, e);
        });
      }

      this.historyList.appendChild(item);
    });
  }
}

window.ChatApp = ChatApp;
