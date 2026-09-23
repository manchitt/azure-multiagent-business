/**
 * Document Grounding & File Search UI Controller
 * Manages enterprise document selection, simulated uploads, and vector index badges.
 */

class DocumentGroundingUI {
  constructor(queryConsole) {
    this.queryConsole = queryConsole;
    this.documents = [
      { id: 'doc-01', name: 'Azure_AI_Foundry_Architecture_Whitepaper.pdf', size: '1.4 MB', category: 'Technical Blueprint', chunks: 18, selected: true },
      { id: 'doc-02', name: 'Global_SaaS_Financial_Benchmarks_2026.pdf', size: '860 KB', category: 'Financial Benchmarks', chunks: 14, selected: true },
      { id: 'doc-03', name: 'MultiAgent_Unit_Economics_Model.xlsx', size: '512 KB', category: 'Cost & Margin Models', chunks: 10, selected: true },
      { id: 'doc-04', name: 'Enterprise_Security_Compliance_Audit.pdf', size: '720 KB', category: 'Governance & Zero Trust', chunks: 12, selected: false },
    ];

    this.container = document.getElementById('grounding-docs-container');
    this.uploadInput = document.getElementById('file-upload-input');
    this.init();
  }

  async init() {
    // Fetch live documents from backend if available
    try {
      const resp = await fetch('/api/grounding/documents');
      if (resp.ok) {
        const liveDocs = await resp.json();
        if (liveDocs && liveDocs.length) {
          this.documents = liveDocs.map(d => ({
            id: d.id,
            name: d.name,
            size: `${d.size_kb} KB`,
            category: d.category,
            chunks: d.chunks_count,
            selected: true,
          }));
        }
      }
    } catch (e) {
      // Use fallback
    }

    this.render();
    this.initEventListeners();
  }

  initEventListeners() {
    if (this.uploadInput) {
      this.uploadInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          this.documents.push({
            id: `doc-${Date.now().toString().slice(-4)}`,
            name: file.name,
            size: `${Math.round(file.size / 1024)} KB`,
            category: 'User Uploaded Grounding',
            chunks: Math.floor(file.size / 2048) + 4,
            selected: true,
          });
        });
        this.render();
        alert(`Successfully indexed ${files.length} document(s) into Azure AI Search vector vault.`);
      });
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.documents.forEach(doc => {
      const badge = document.createElement('div');
      badge.className = `flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
        doc.selected
          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/30'
          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
      }`;

      badge.innerHTML = `
        <span class="text-sm">${doc.selected ? '✓' : '+'}</span>
        <span class="truncate max-w-[180px] font-medium" title="${doc.name}">${doc.name}</span>
        <span class="text-[10px] text-slate-500 font-mono">(${doc.chunks} chunks)</span>
      `;

      badge.addEventListener('click', () => {
        doc.selected = !doc.selected;
        this.updateSelectedList();
        this.render();
      });

      this.container.appendChild(badge);
    });

    this.updateSelectedList();
  }

  updateSelectedList() {
    const selectedIds = this.documents.filter(d => d.selected).map(d => d.id);
    if (this.queryConsole) {
      this.queryConsole.selectedDocIds = selectedIds;
    }
  }
}

window.DocumentGroundingUI = DocumentGroundingUI;
