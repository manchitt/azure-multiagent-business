/**
 * Minimal Application Controller
 * Handles health checking against Azure AI Foundry and initializes the query console.
 */

const APP_API = "";

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Query Console
  new QueryConsole();

  // Check Azure AI Foundry Backend Status
  checkSystemStatus();
});

/**
 * Checks system status against GET /api/health
 */
async function checkSystemStatus() {
  const statusPill = document.getElementById('azure-status-pill');
  const statusText = document.getElementById('azure-status-text');
  if (!statusPill || !statusText) return;

  try {
    const resp = await fetch(`${APP_API}/api/health`);
    if (resp.ok) {
      const data = await resp.json();
      statusText.textContent = `${data.agent || "business-orchestrator"}:v${data.version || "7"}`;
      statusPill.classList.remove('text-neutral-500', 'border-neutral-800');
      statusPill.classList.add('text-neutral-300', 'border-neutral-700');
    }
  } catch (err) {
    statusText.textContent = "Connecting...";
  }
}
