/**
 * MULTI AGENT BUSINESS ASSISTANT — App Bootstrap
 */

const APP_API = "";

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the ChatGPT-style interface
  new ChatApp();

  // Poll system status from GET /api/health
  checkSystemStatus();
});

async function checkSystemStatus() {
  const sidebarAgentLabel = document.getElementById('sidebar-agent-label');
  const bottomStatusLabel = document.getElementById('bottom-status-label');
  const sidebarDot = document.getElementById('sidebar-status-dot');

  try {
    const resp = await fetch(`${APP_API}/api/health`);
    if (resp.ok) {
      const data = await resp.json();
      const label = `${data.agent || 'business-orchestrator'}:v${data.version || '13'}`;
      if (sidebarAgentLabel) sidebarAgentLabel.textContent = label;
      if (bottomStatusLabel) bottomStatusLabel.textContent = `${label} Active`;
      if (sidebarDot) {
        sidebarDot.className = "w-2 h-2 rounded-full bg-emerald-500";
      }
    }
  } catch (err) {
    if (sidebarAgentLabel) sidebarAgentLabel.textContent = "Connecting to Foundry...";
    if (bottomStatusLabel) bottomStatusLabel.textContent = "Connecting...";
    if (sidebarDot) {
      sidebarDot.className = "w-2 h-2 rounded-full bg-amber-500 animate-pulse";
    }
  }
}
