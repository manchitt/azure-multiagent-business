/**
 * A2A (Agent-to-Agent) Interactive Canvas Visualizer
 * Animates agent nodes, A2A communication mesh, and data packet flows.
 */

class A2AVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.packets = [];
    this.activeAgentId = null;
    this.hoveredNode = null;

    // Node definitions
    this.nodes = [
      { id: 'agent-orchestrator', label: 'Orchestrator Agent', role: 'Central Coordinator', x: 0.5, y: 0.22, color: '#3B82F6', icon: 'cpu', radius: 36, status: 'Ready' },
      { id: 'agent-research', label: '🔎 Research Agent', role: 'Web Search & Intel', x: 0.22, y: 0.62, color: '#38BDF8', icon: 'search', radius: 30, status: 'Ready' },
      { id: 'agent-analyst', label: '📊 Analyst Agent', role: 'Document Grounding', x: 0.5, y: 0.78, color: '#34D399', icon: 'bar-chart-2', radius: 30, status: 'Ready' },
      { id: 'agent-strategy', label: '🎯 Strategy Agent', role: 'Actionable Insights', x: 0.78, y: 0.62, color: '#A78BFA', icon: 'target', radius: 30, status: 'Ready' },
      // Satellite tool nodes
      { id: 'tool-websearch', label: 'Bing Web Search', role: 'External Grounding', x: 0.1, y: 0.4, color: '#0284C7', icon: 'globe', radius: 22, isTool: true },
      { id: 'tool-filesearch', label: 'Azure AI Search', role: 'Vector File Vault', x: 0.5, y: 0.95, color: '#059669', icon: 'file-text', radius: 22, isTool: true },
    ];

    // Edges (A2A channels)
    this.edges = [
      { from: 'agent-orchestrator', to: 'agent-research', label: 'A2A Delegate' },
      { from: 'agent-research', to: 'agent-analyst', label: 'A2A Handoff' },
      { from: 'agent-analyst', to: 'agent-strategy', label: 'A2A Handoff' },
      { from: 'agent-strategy', to: 'agent-orchestrator', label: 'A2A Handoff' },
      { from: 'agent-orchestrator', to: 'agent-analyst', label: 'A2A Context' },
      // Tool edges
      { from: 'agent-research', to: 'tool-websearch', label: 'Tool Grounding' },
      { from: 'agent-analyst', to: 'tool-filesearch', label: 'File Search' },
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initInteraction();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = (rect.height || 420) * (window.devicePixelRatio || 1);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height || 420}px`;
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.w = rect.width;
    this.h = rect.height || 420;
  }

  initInteraction() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      let found = null;
      for (const node of this.nodes) {
        const nx = node.x * this.w;
        const ny = node.y * this.h;
        const dist = Math.hypot(mx - nx, my - ny);
        if (dist <= node.radius) {
          found = node;
          break;
        }
      }
      this.hoveredNode = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
    });
  }

  triggerA2AHandoff(fromId, toId, packetCount = 8) {
    const fromNode = this.nodes.find(n => n.id === fromId);
    const toNode = this.nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return;

    for (let i = 0; i < packetCount; i++) {
      this.packets.push({
        from: fromNode,
        to: toNode,
        progress: - (i * 0.12),
        speed: 0.015 + Math.random() * 0.01,
        color: fromNode.color,
        size: 3.5 + Math.random() * 2,
      });
    }
  }

  setActiveAgent(agentId) {
    this.activeAgentId = agentId;
    this.nodes.forEach(n => {
      if (n.id === agentId) {
        n.status = 'Processing';
      } else {
        n.status = 'Ready';
      }
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw Edges (A2A Mesh)
    for (const edge of this.edges) {
      const n1 = this.nodes.find(n => n.id === edge.from);
      const n2 = this.nodes.find(n => n.id === edge.to);
      if (!n1 || !n2) continue;

      const x1 = n1.x * this.w;
      const y1 = n1.y * this.h;
      const x2 = n2.x * this.w;
      const y2 = n2.y * this.h;

      // Line style
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = edge.label.includes('Tool') ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.3)';
      this.ctx.lineWidth = edge.label.includes('Tool') ? 1.5 : 2;
      this.ctx.setLineDash([4, 6]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // 2. Draw Moving Data Packets
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        this.packets.splice(i, 1);
        continue;
      }

      if (p.progress > 0) {
        const x1 = p.from.x * this.w;
        const y1 = p.from.y * this.h;
        const x2 = p.to.x * this.w;
        const y2 = p.to.y * this.h;

        const px = x1 + (x2 - x1) * p.progress;
        const py = y1 + (y2 - y1) * p.progress;

        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }

    // 3. Draw Nodes
    const time = Date.now() * 0.003;
    for (const node of this.nodes) {
      const nx = node.x * this.w;
      const ny = node.y * this.h;
      const isActive = this.activeAgentId === node.id;
      const isHovered = this.hoveredNode === node;

      // Glow ring for active agent
      if (isActive) {
        const pulse = 1 + Math.sin(time * 3) * 0.15;
        this.ctx.beginPath();
        this.ctx.arc(nx, ny, node.radius * pulse + 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = node.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
      }

      // Outer circle
      this.ctx.beginPath();
      this.ctx.arc(nx, ny, node.radius + (isHovered ? 4 : 0), 0, Math.PI * 2);
      this.ctx.fillStyle = node.isTool ? '#0A192F' : '#0F172A';
      this.ctx.fill();
      this.ctx.strokeStyle = isHovered ? '#38BDF8' : node.color;
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.stroke();

      // Inner Core Accent
      this.ctx.beginPath();
      this.ctx.arc(nx, ny, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.shadowColor = node.color;
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Node label
      this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      this.ctx.fillStyle = '#F8FAFC';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.label, nx, ny + node.radius + 18);

      // Node role / subtext
      this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      this.ctx.fillStyle = '#94A3B8';
      this.ctx.fillText(node.role, nx, ny + node.radius + 30);
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.A2AVisualizer = A2AVisualizer;
