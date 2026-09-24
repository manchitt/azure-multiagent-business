/**
 * MULTI AGENT BUSINESS ASSISTANT — Apple Minimal Pure Black Edition
 * 
 * Features:
 * 1. Text-to-Speech (TTS) Voice Engine (Siri-like natural female voice) for spoken responses
 * 2. Real-Time Voice Search (Speech-to-Text via Web Speech API)
 * 3. Persistent Multi-Turn Conversation Recents in Sidebar
 * 4. Same-origin integration with Azure AI Foundry business-orchestrator:13
 */

const API = "";

/* ==================== SIRI-STYLE VOICE SYNTHESIS ENGINE ==================== */
class SiriVoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.currentUtterance = null;
    this.activeButton = null;
    this.activeRowId = null;

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getSiriLikeVoice() {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    // Ranked list of natural Siri / Apple / Neural female voices
    const preferredVoices = [
      'Samantha',                          // macOS / iOS primary natural Siri voice
      'Microsoft Jenny Online (Natural)',  // Microsoft Edge natural female
      'Microsoft Aria Online (Natural)',   // Microsoft Edge natural female
      'Karen',                             // Apple AU female
      'Victoria',                          // Apple UK female
      'Moira',                             // Apple Ireland female
      'Google US English',                 // Chrome standard female
      'en-US-Standard-C',
      'Zira',
    ];

    for (const name of preferredVoices) {
      const match = this.voices.find(v => v.name.includes(name) || v.voiceURI.includes(name));
      if (match) return match;
    }

    // Fallback: any female voice in English
    const femaleEn = this.voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural'))
    );
    if (femaleEn) return femaleEn;

    // Fallback: standard US English
    return this.voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en')) || this.voices[0];
  }

  cleanTextForSpeech(raw) {
    if (!raw) return '';
    return raw
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')  // Skip code snippets
      .replace(/`([^`]+)`/g, '$1')                        // Inline code
      .replace(/[*_~#]/g, ' ')                            // Markdown marks
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')           // Links: keep text only
      .replace(/https?:\/\/\S+/g, '')                     // URLs
      .replace(/^\s*[-•]\s*/gm, '')                       // Bullets
      .replace(/\s+/g, ' ')                               // Multiple spaces
      .trim();
  }

  speak(text, rowId, buttonEl) {
    if (!this.synth) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    // Toggle: If currently speaking this exact message, stop it
    if (this.synth.speaking && this.activeRowId === rowId) {
      this.stop();
      return;
    }

    // Stop any existing speech
    this.stop();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = this.getSiriLikeVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // Siri cadence: calm, natural pace and slight pitch elevation
    utterance.rate = 1.02;
    utterance.pitch = 1.06;

    this.activeRowId = rowId;
    this.activeButton = buttonEl;

    utterance.onstart = () => {
      this.updateButtonUI(buttonEl, true);
    };

    utterance.onend = () => {
      this.cleanupCurrent(buttonEl);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      this.cleanupCurrent(buttonEl);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.activeButton) {
      this.updateButtonUI(this.activeButton, false);
    }
    this.activeRowId = null;
    this.activeButton = null;
    this.currentUtterance = null;
  }

  cleanupCurrent(buttonEl) {
    this.updateButtonUI(buttonEl, false);
    if (this.activeRowId) {
      this.activeRowId = null;
      this.activeButton = null;
      this.currentUtterance = null;
    }
  }

  updateButtonUI(buttonEl, isPlaying) {
    if (!buttonEl) return;
    if (isPlaying) {
      buttonEl.classList.add('audio-playing', 'text-sky-400', 'border-sky-800/60');
      buttonEl.classList.remove('text-neutral-400');
      buttonEl.innerHTML = `
        <span class="flex items-center space-x-1 mr-1">
          <span class="sound-bar inline-block w-0.5 bg-sky-400 rounded-full"></span>
          <span class="sound-bar inline-block w-0.5 bg-sky-400 rounded-full"></span>
          <span class="sound-bar inline-block w-0.5 bg-sky-400 rounded-full"></span>
        </span>
        <span>Stop</span>
      `;
    } else {
      buttonEl.classList.remove('audio-playing', 'text-sky-400', 'border-sky-800/60');
      buttonEl.classList.add('text-neutral-400');
      buttonEl.innerHTML = `
        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
        </svg>
        <span>Listen</span>
      `;
    }
  }
}

/* ==================== MAIN CHAT APP CONTROLLER ==================== */
class ChatApp {
  constructor() {
    this.tts = new SiriVoiceSynthesizer();
    this.conversations = this.loadConversations();
    this.activeConversationId = null;
    this.isGenerating = false;
    this.isListening = false;
    this.wasVoiceInput = false;
    this.recognition = null;

    // Short, real-world executive starter prompts
    this.starters = {
      preset1: "Compare top competitors in enterprise B2B SaaS, their pricing models, and key vulnerabilities.",
      preset2: "What are healthy SaaS gross margins, CAC payback, and LTV/CAC benchmarks for Series B?",
      preset3: "Draft a 30-60-90 day strategic execution roadmap for a B2B product launch.",
      preset4: "Calculate TAM, SAM, and key growth drivers for cloud AI software.",
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
    this.emptyState = document.getElementById('empty-state');
    this.messagesContainer = document.getElementById('messages-container');
    this.scrollArea = document.getElementById('chat-scroll-area');
    this.btnNewChat = document.getElementById('btn-new-chat');
    this.btnClearChat = document.getElementById('btn-clear-chat');
    this.btnClearAllHistory = document.getElementById('btn-clear-all-history');
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    this.sidebar = document.getElementById('chat-sidebar');
    this.historyList = document.getElementById('chat-history-list');

    // Right Agent Swarm Monitor Sidebar
    this.btnToggleAgents = document.getElementById('btn-toggle-agents');
    this.btnCloseAgents = document.getElementById('btn-close-agents');
    this.agentsSidebar = document.getElementById('agents-sidebar');
    this.headerSwarmIndicator = document.getElementById('header-swarm-indicator');
    this.swarmTimers = [];
  }

  initEventListeners() {
    // Send button
    if (this.btnSend) {
      this.btnSend.addEventListener('click', () => this.sendMessage());
    }

    // Auto-resizing textarea & Enter key
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
          this.tts.stop();
          this.conversations = [];
          this.saveConversations();
          this.startNewChat();
          this.renderHistory();
        }
      });
    }

    // Toggle Left Chat History Sidebar
    if (this.btnToggleSidebar && this.sidebar) {
      this.btnToggleSidebar.addEventListener('click', () => {
        const isHidden = this.sidebar.classList.contains('hidden') || this.sidebar.style.display === 'none';
        if (isHidden) {
          this.sidebar.classList.remove('hidden');
          this.sidebar.style.display = 'flex';
        } else {
          this.sidebar.classList.add('hidden');
          this.sidebar.style.display = 'none';
        }
      });
    }

    // Toggle Right Swarm Agents Monitor Sidebar
    if (this.btnToggleAgents) {
      this.btnToggleAgents.addEventListener('click', () => this.toggleAgentsSidebar());
    }
    if (this.btnCloseAgents) {
      this.btnCloseAgents.addEventListener('click', () => this.toggleAgentsSidebar(false));
    }

    // Initialize sidebar default state: open on desktop, closed on mobile
    if (window.innerWidth >= 1024) {
      this.toggleAgentsSidebar(true);
    } else {
      this.toggleAgentsSidebar(false);
    }

    // Shortcut Cmd/Ctrl + K for New Chat
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.startNewChat();
      }
    });
  }

  /* ==================== VOICE SEARCH (SPEECH-TO-TEXT) ==================== */
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
          <button id="btn-cancel-voice" class="text-neutral-400 hover:text-white text-[11px] font-medium">Done</button>
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
        this.wasVoiceInput = true;
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
            <span class="text-red-400">Microphone blocked. Click the lock/tune icon in your address bar to allow.</span>
            <button id="btn-dismiss-mic" class="text-neutral-400 hover:text-white text-[11px] ml-2">Dismiss</button>
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

  /* ==================== AGENT SWARM MONITOR CONTROLS ==================== */
  toggleAgentsSidebar(force) {
    if (!this.agentsSidebar) return;
    const isCurrentlyOpen = this.agentsSidebar.style.display === 'flex' || 
      (!this.agentsSidebar.classList.contains('hidden') && this.agentsSidebar.style.display !== 'none');
    const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;

    if (shouldOpen) {
      this.agentsSidebar.style.display = 'flex';
      this.agentsSidebar.classList.remove('hidden');
      if (this.btnToggleAgents) {
        this.btnToggleAgents.classList.add('border-neutral-600', 'bg-neutral-800');
      }
    } else {
      this.agentsSidebar.style.display = 'none';
      this.agentsSidebar.classList.add('hidden');
      if (this.btnToggleAgents) {
        this.btnToggleAgents.classList.remove('border-neutral-600', 'bg-neutral-800');
      }
    }
  }

  setAgentStatus(agentKey, status, taskDetail) {
    const card = document.getElementById(`card-agent-${agentKey}`);
    const badge = document.getElementById(`badge-agent-${agentKey}`);
    const task = document.getElementById(`task-agent-${agentKey}`);
    if (!card || !badge) return;

    if (status === 'busy' || status === 'working') {
      card.classList.remove('agent-card-idle');
      card.classList.add('agent-card-busy');
      badge.className = 'agent-badge-busy text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center space-x-1';
      badge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
        <span class="capitalize">${status === 'busy' ? 'Busy' : 'Working'}</span>
      `;
    } else {
      card.classList.remove('agent-card-busy');
      card.classList.add('agent-card-idle');
      badge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center space-x-1';
      badge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Idle</span>
      `;
    }

    if (task && taskDetail) {
      task.textContent = taskDetail;
    }
  }

  startSwarmLifecycle() {
    if (this.swarmTimers) {
      this.swarmTimers.forEach(t => clearTimeout(t));
    }
    this.swarmTimers = [];

    if (this.headerSwarmIndicator) {
      this.headerSwarmIndicator.className = 'w-2 h-2 rounded-full bg-sky-400 animate-ping';
    }

    // Step 1: Orchestrator begins coordinating
    this.setAgentStatus('orchestrator', 'busy', 'Decomposing query & orchestrating mesh...');
    this.setAgentStatus('research', 'idle', 'Queued: awaiting search dispatch');
    this.setAgentStatus('analyst', 'idle', 'Queued: awaiting grounding dispatch');
    this.setAgentStatus('strategy', 'idle', 'Queued: awaiting synthesis');

    // Step 2: Research Agent dispatched
    this.swarmTimers.push(setTimeout(() => {
      this.setAgentStatus('research', 'working', 'Querying live Bing search & market feeds...');
      this.setAgentStatus('orchestrator', 'busy', 'Streaming research data packets...');
    }, 900));

    // Step 3: Analyst Agent processes data
    this.swarmTimers.push(setTimeout(() => {
      this.setAgentStatus('research', 'idle', 'Research data grounded');
      this.setAgentStatus('analyst', 'working', 'Executing Azure AI Search & financial grounding...');
    }, 2200));

    // Step 4: Strategy Agent constructs response
    this.swarmTimers.push(setTimeout(() => {
      this.setAgentStatus('analyst', 'idle', 'Financial grounding complete');
      this.setAgentStatus('strategy', 'working', 'Synthesizing strategic execution plan...');
    }, 3800));
  }

  resetAllAgentsToIdle() {
    if (this.swarmTimers) {
      this.swarmTimers.forEach(t => clearTimeout(t));
      this.swarmTimers = [];
    }

    this.setAgentStatus('orchestrator', 'idle', 'Standing by for inquiries');
    this.setAgentStatus('research', 'idle', 'Standing by for research tasks');
    this.setAgentStatus('analyst', 'idle', 'Standing by for financial data');
    this.setAgentStatus('strategy', 'idle', 'Standing by for strategic synthesis');

    if (this.headerSwarmIndicator) {
      this.headerSwarmIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
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
    this.tts.stop();
    this.stopVoiceListening();
    this.resetAllAgentsToIdle();
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

    const shouldAutoSpeak = this.wasVoiceInput;
    this.wasVoiceInput = false;

    this.tts.stop();
    this.stopVoiceListening();
    this.isGenerating = true;
    this.updateSendButtonState();

    // Ensure active conversation object exists
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

    // 1. Render User Message Bubble
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
    this.scrollToResponseStart(assistantRowId);

    // 3. Trigger Live Agent Swarm Monitor Workflow
    this.startSwarmLifecycle();

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
      this.updateAssistantBubbleWithRealData(assistantRowId, data, shouldAutoSpeak);

      // Save assistant response to conversation history
      if (currentConv) {
        currentConv.messages.push({ role: 'assistant', data: data });
        this.saveConversations();
      }

    } catch (err) {
      console.error("Chat error:", err);
      this.renderAssistantError(assistantRowId, err.message);
    } finally {
      if (this.loadingTimers) {
        this.loadingTimers.forEach(t => clearTimeout(t));
        this.loadingTimers = [];
      }
      this.resetAllAgentsToIdle();
      this.isGenerating = false;
      this.updateSendButtonState();
      // Keep view anchored at the start of the assistant response
      this.scrollToResponseStart(assistantRowId);
    }
  }

  appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row flex justify-end';
    row.innerHTML = `
      <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 bg-[#1C1C1F] text-[#F5F5F7] text-sm leading-relaxed border border-neutral-800/80 whitespace-pre-wrap font-sans">
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
          <span id="${rowId}-status-text">Orchestrator initiating multi-agent swarm...</span>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(row);

    // Staged progress indicators for brisk responsiveness
    const t1 = setTimeout(() => {
      const el = document.getElementById(`${rowId}-status-text`);
      if (el) el.textContent = "Analyzing strategic context & metrics...";
    }, 1200);
    const t2 = setTimeout(() => {
      const el = document.getElementById(`${rowId}-status-text`);
      if (el) el.textContent = "Evaluating benchmarks & financial models...";
    }, 3000);
    const t3 = setTimeout(() => {
      const el = document.getElementById(`${rowId}-status-text`);
      if (el) el.textContent = "Synthesizing executive deliverable...";
    }, 5500);
    if (!this.loadingTimers) this.loadingTimers = [];
    this.loadingTimers.push(t1, t2, t3);
  }

  updateAssistantBubbleWithRealData(rowId, data, autoSpeak = false) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const usage = data.usage || {};
    const steps = data.agent_activity || [];
    const citations = data.citations || [];
    const toolCalls = data.tool_calls || [];
    const responseText = data.response || 'No response returned.';

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

    // Clean deduplicated Citations & Tools Badges (Max 3-4 clean badges)
    let sourcesHtml = '';
    const uniqueToolTypes = new Set();
    toolCalls.forEach(t => {
      const type = (t.type || t.name || '').toLowerCase();
      if (type.includes('search') || type.includes('bing') || type.includes('web')) {
        uniqueToolTypes.add('web_search');
      } else if (type.includes('ground') || type.includes('doc') || type.includes('file')) {
        uniqueToolTypes.add('grounding');
      } else if (type) {
        uniqueToolTypes.add(type);
      }
    });

    const uniqueCitations = [];
    const seenTitles = new Set();
    citations.forEach(c => {
      const title = (c.title || c.url || 'Grounded Document').trim();
      if (!seenTitles.has(title)) {
        seenTitles.add(title);
        uniqueCitations.push({ title, url: c.url || '' });
      }
    });

    const badges = [];

    // 1. Web search badge
    if (uniqueToolTypes.has('web_search') || citations.some(c => c.url && c.url.startsWith('http'))) {
      badges.push(`
        <span class="inline-flex items-center px-2 py-0.5 rounded bg-[#101014] border border-neutral-800 text-[11px] font-mono text-neutral-300">
          <span class="mr-1.5 text-sky-400">🌐</span>
          <span>Web Search Grounded</span>
        </span>
      `);
    }

    // 2. Specific unique citations or document grounding badge
    const specificDocs = uniqueCitations.filter(c => c.title !== 'Grounded Document');
    if (specificDocs.length > 0) {
      specificDocs.slice(0, 3).forEach(doc => {
        badges.push(`
          <span class="inline-flex items-center px-2 py-0.5 rounded bg-[#101014] border border-neutral-800 text-[11px] font-mono text-neutral-300 max-w-[240px] truncate" title="${this.escapeHtml(doc.title)}">
            <span class="mr-1.5 text-emerald-400">📄</span>
            <span class="truncate">${this.escapeHtml(doc.title)}</span>
          </span>
        `);
      });
      if (specificDocs.length > 3) {
        badges.push(`
          <span class="inline-flex items-center px-2 py-0.5 rounded bg-[#101014] border border-neutral-800 text-[11px] font-mono text-neutral-400">
            +${specificDocs.length - 3} more sources
          </span>
        `);
      }
    } else if (citations.length > 0 || uniqueToolTypes.has('grounding')) {
      badges.push(`
        <span class="inline-flex items-center px-2 py-0.5 rounded bg-[#101014] border border-neutral-800 text-[11px] font-mono text-neutral-300">
          <span class="mr-1.5 text-emerald-400">📄</span>
          <span>Azure AI Document Grounded (${citations.length} ${citations.length === 1 ? 'citation' : 'citations'})</span>
        </span>
      `);
    }

    if (badges.length > 0) {
      sourcesHtml = `
        <div class="mt-3 pt-3 border-t border-neutral-900/80 flex flex-wrap items-center gap-2">
          ${badges.join('')}
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
          ${this.escapeHtml(responseText)}
        </div>

        <!-- Grounded Sources -->
        ${sourcesHtml}

        <!-- Apple-Style Bottom Action Bar (Listen + Copy + Telemetry) -->
        <div class="flex flex-wrap items-center justify-between pt-2.5 text-[11px] font-mono text-neutral-500 gap-2 border-t border-neutral-900/40">
          <div class="flex items-center space-x-2.5">
            <span>Tokens: ${usage.total_tokens || 0}</span>
            <span>•</span>
            <span>Latency: ${data.cached ? '<span class="text-emerald-400 font-bold">0ms (Instant Cache)</span>' : `${usage.latency_ms || 0}ms`}</span>
            ${data.cached ? '<span class="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 font-mono text-[9px]">⚡ Fast Cache</span>' : ''}
          </div>

          <div class="flex items-center space-x-2">
            <!-- TTS Listen Button -->
            <button 
              class="btn-listen flex items-center px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer" 
              title="Listen to spoken response (Siri Voice)"
            >
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
              </svg>
              <span>Listen</span>
            </button>

            <!-- Copy Button -->
            <button 
              class="btn-copy flex items-center px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer" 
              title="Copy text to clipboard"
            >
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach Listen button listener (TTS)
    const listenBtn = row.querySelector('.btn-listen');
    if (listenBtn) {
      listenBtn.addEventListener('click', () => {
        this.tts.speak(responseText, rowId, listenBtn);
      });
    }

    // Attach Copy button listener
    const copyBtn = row.querySelector('.btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(responseText).then(() => {
          copyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-emerald-400">Copied</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>Copy</span>
            `;
          }, 1800);
        });
      });
    }

    // Auto-Speak with Siri female voice if query was spoken by user
    if (autoSpeak && responseText && listenBtn) {
      setTimeout(() => {
        this.tts.speak(responseText, rowId, listenBtn);
      }, 400);
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

  scrollToResponseStart(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  /* ==================== MULTI-SESSION PERSISTENT CHAT HISTORY ==================== */
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
    this.tts.stop();
    const conv = this.conversations.find(c => c.id === convId);
    if (!conv) return;

    this.activeConversationId = conv.id;
    this.emptyState.classList.add('hidden');
    this.messagesContainer.classList.remove('hidden');
    this.messagesContainer.innerHTML = '';

    // Replay saved conversation
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
    this.tts.stop();
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
      item.className = `group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border border-transparent transition-all cursor-pointer ${
        isActive ? 'chat-history-active' : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#141416]'
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
