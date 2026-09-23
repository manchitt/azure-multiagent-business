/**
 * Main Application Controller & ROI Calculator
 */

// Same-origin API root
const APP_API = "";

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas Visualizer
  const visualizer = new A2AVisualizer('a2a-canvas');

  // 2. Initialize Query Console (Real Azure AI Foundry)
  new QueryConsole(visualizer);

  // 3. Initialize Architecture Explorer
  new ArchitectureExplorer();

  // 4. Initialize Agent Catalog
  new AgentCatalog();

  // 5. Initialize Dynamic ROI Calculator
  initRoiCalculator();

  // 6. Check Azure AI Foundry Backend Status
  checkSystemStatus();

  // 7. Mobile Navigation Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});

/**
 * Dynamic ROI & Business Model Calculator
 */
function initRoiCalculator() {
  const sliderWorkflows = document.getElementById('slider-workflows');
  const sliderHours = document.getElementById('slider-hours');
  const sliderRate = document.getElementById('slider-rate');

  const valWorkflows = document.getElementById('val-workflows');
  const valHours = document.getElementById('val-hours');
  const valRate = document.getElementById('val-rate');

  const metricSavings = document.getElementById('roi-annual-savings');
  const metricHoursSaved = document.getElementById('roi-hours-saved');
  const metricRoiPercent = document.getElementById('roi-percent');
  const metricAgentCost = document.getElementById('roi-agent-cost');
  const metricHumanCost = document.getElementById('roi-human-cost');

  function calculate() {
    const workflows = parseInt(sliderWorkflows.value, 10);
    const hours = parseInt(sliderHours.value, 10);
    const rate = parseInt(sliderRate.value, 10);

    // Updates slider label values
    if (valWorkflows) valWorkflows.textContent = workflows.toLocaleString();
    if (valHours) valHours.textContent = `${hours} hrs`;
    if (valRate) valRate.textContent = `$${rate}/hr`;

    // Monthly & Annual Calculations
    const monthlyHumanCost = workflows * hours * rate;
    const annualHumanCost = monthlyHumanCost * 12;

    // Azure Multi-Agent Cost: Approx $0.0042 tokens + $0.035 Azure container/search amortized per workflow + $120/mo base Azure hosting
    const costPerWorkflowAzure = 0.0392;
    const monthlyAzureCost = (workflows * costPerWorkflowAzure) + 120;
    const annualAzureCost = monthlyAzureCost * 12;

    const annualSavings = Math.max(0, annualHumanCost - annualAzureCost);
    const annualHoursSaved = workflows * hours * 12;
    const roiPercentage = annualAzureCost > 0 ? Math.round((annualSavings / annualAzureCost) * 100) : 0;

    // Update UI elements
    if (metricSavings) metricSavings.textContent = `$${Math.round(annualSavings).toLocaleString()}`;
    if (metricHoursSaved) metricHoursSaved.textContent = `${Math.round(annualHoursSaved).toLocaleString()} hrs`;
    if (metricRoiPercent) metricRoiPercent.textContent = `${roiPercentage.toLocaleString()}%`;
    if (metricAgentCost) metricAgentCost.textContent = `$${Math.round(annualAzureCost).toLocaleString()}/yr`;
    if (metricHumanCost) metricHumanCost.textContent = `$${Math.round(annualHumanCost).toLocaleString()}/yr`;
  }

  if (sliderWorkflows && sliderHours && sliderRate) {
    sliderWorkflows.addEventListener('input', calculate);
    sliderHours.addEventListener('input', calculate);
    sliderRate.addEventListener('input', calculate);
    calculate();
  }
}

/**
 * Backend Status Poller
 */
async function checkSystemStatus() {
  const statusPill = document.getElementById('azure-status-pill');
  const statusText = document.getElementById('azure-status-text');
  if (!statusPill || !statusText) return;

  try {
    const resp = await fetch(`${APP_API}/api/health`);
    if (resp.ok) {
      const data = await resp.json();
      statusText.textContent = `${data.agent || "business-orchestrator"}:v${data.version || "7"} Connected`;
      statusPill.classList.remove('bg-amber-900/40', 'border-amber-700', 'text-amber-300');
      statusPill.classList.add('bg-emerald-950/60', 'border-emerald-600', 'text-emerald-300');
    }
  } catch (err) {
    statusText.textContent = "Connecting to Foundry...";
  }
}
