/**
 * Agent Catalog & System Prompt Inspector Controller
 */

class AgentCatalog {
  constructor() {
    this.agents = [
      {
        id: "agent-orchestrator",
        name: "Orchestrator Agent",
        role: "Central Coordinator & Executive Synthesizer",
        icon: "cpu",
        color: "#3B82F6",
        badge: "Lead Orchestrator",
        model: "GPT-4.1-mini",
        temperature: 0.2,
        tools: ["A2A Task Router", "Query Decomposer", "Executive Synthesizer"],
        description: "The primary point of contact for the executive user. Deconstructs ambiguous business questions into structured sub-tasks, dispatches work to the Research, Analyst, and Strategy agents via A2A protocols, and merges all findings into a unified report.",
        system_prompt: `You are the lead Orchestrator Agent in Microsoft Azure AI Foundry.
Your mission is to understand user business inquiries, plan multi-agent workflows, coordinate sub-agents via A2A messaging, and deliver a coherent executive response.
1. Decompose the user's inquiry into research goals, data analysis requirements, and strategic objectives.
2. Delegate to the Research Agent for web search and market signals.
3. Coordinate with the Analyst Agent for document grounding, financial modeling, and unit economics.
4. Instruct the Strategy Agent to synthesize findings into actionable roadmaps and SWOT frameworks.
5. Merge all agent outputs into a unified, high-value executive business report.`,
      },
      {
        id: "agent-research",
        name: "🔎 Research Agent",
        role: "Market, Competitor & Trend Intelligence",
        icon: "search",
        color: "#38BDF8",
        badge: "Web Grounded",
        model: "GPT-4.1-mini",
        temperature: 0.2,
        tools: ["Bing Web Search", "Company Profiler", "Trend Radar"],
        description: "Scours real-time web telemetry to discover company profiles, market CAGR, competitor market share breakdowns, and macroeconomic headwinds.",
        system_prompt: `You are the specialized Research Agent in Microsoft Azure AI Foundry.
Your mission is to perform rigorous market intelligence, competitive moat analysis, company profiling, and trend discovery.
You utilize Azure AI Foundry Web Search grounding to retrieve real-time facts, market shares, regulatory updates, and competitor moves.
Format your findings with clear empirical evidence and authoritative sources before transmitting via A2A to the Analyst Agent.`,
      },
      {
        id: "agent-analyst",
        name: "📊 Analyst Agent",
        role: "Quantitative Business & Data Analysis",
        icon: "bar-chart-2",
        color: "#34D399",
        badge: "Document Grounded",
        model: "GPT-4.1-mini",
        temperature: 0.1,
        tools: ["Azure AI Search File Grounding", "Financial Modeler", "Risk Evaluator"],
        description: "Queries internal organizational files and financial models via Azure AI Search vector retrieval. Calculates unit economics, gross margins, payback periods, and risk matrices.",
        system_prompt: `You are the specialized Analyst Agent in Microsoft Azure AI Foundry.
Your mission is to perform rigorous quantitative business evaluation, unit economics analysis, and financial feasibility modeling.
You retrieve grounded enterprise documents via Azure AI Search (File Search) to anchor all numbers in verified organizational filings, benchmarks, and data sheets.
Synthesize empirical metrics into structured financial models and send via A2A to the Strategy Agent.`,
      },
      {
        id: "agent-strategy",
        name: "🎯 Strategy Agent",
        role: "Strategic Planning & Actionable Roadmap",
        icon: "target",
        color: "#A78BFA",
        badge: "Strategic Core",
        model: "GPT-4.1-mini",
        temperature: 0.3,
        tools: ["SWOT Generator", "Roadmap Architect", "Competitive Moat Formulator"],
        description: "Transforms raw research and financial calculations into executive action plans, defensible competitive moats, SWOT frameworks, and prioritized 30-60-90 day roadmaps.",
        system_prompt: `You are the specialized Strategy Agent in Microsoft Azure AI Foundry.
Your mission is to synthesize market research and financial analysis into executive-grade strategy.
Formulate clear, prioritized action steps, a rigorous SWOT matrix, competitive moat defenses, and a 30-60-90 day execution roadmap.
Deliver your strategic package back to the Orchestrator Agent via A2A protocol for final user synthesis.`,
      },
    ];

    this.container = document.getElementById('agent-catalog-grid');
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.agents.forEach(agent => {
      const card = document.createElement('div');
      card.className = 'glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between';

      let toolsHtml = agent.tools.map(t => `<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">${t}</span>`).join('');

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style="background: ${agent.color}20; color: ${agent.color}; border: 1px solid ${agent.color}50;">
                ${agent.icon === 'search' ? '🔎' : agent.icon === 'bar-chart-2' ? '📊' : agent.icon === 'target' ? '🎯' : '⚡'}
              </div>
              <div>
                <h3 class="font-bold text-slate-100 text-base">${agent.name}</h3>
                <span class="text-xs text-slate-400">${agent.role}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold" style="background: ${agent.color}15; color: ${agent.color}; border: 1px solid ${agent.color}40;">
              ${agent.badge}
            </span>
          </div>

          <p class="text-xs text-slate-400 mb-4 leading-relaxed">${agent.description}</p>

          <div class="mb-4">
            <div class="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Assigned Azure Tools:</div>
            <div class="flex flex-wrap gap-1.5">${toolsHtml}</div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded border border-slate-900 mb-4">
            <div>
              <span class="text-slate-500">Model:</span>
              <span class="font-mono text-sky-300 ml-1">${agent.model}</span>
            </div>
            <div>
              <span class="text-slate-500">Temperature:</span>
              <span class="font-mono text-emerald-400 ml-1">${agent.temperature}</span>
            </div>
          </div>
        </div>

        <details class="text-xs text-slate-400 group">
          <summary class="cursor-pointer text-sky-400 hover:text-sky-300 font-medium py-1 list-none flex items-center justify-between">
            <span>Inspect System Prompt</span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <pre class="mt-2 p-2.5 rounded bg-slate-950 border border-slate-900 text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">${agent.system_prompt}</pre>
        </details>
      `;

      this.container.appendChild(card);
    });
  }
}

window.AgentCatalog = AgentCatalog;
