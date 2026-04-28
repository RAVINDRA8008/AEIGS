const DESIGN_AGENTS = [
  { id: 'atlas-grid', primary: '#2dd4bf', secondary: '#0ea5e9', accent: '#22c55e', aura: 'rgba(45,212,191,0.18)' },
  { id: 'velvet-sun', primary: '#f97316', secondary: '#f59e0b', accent: '#ef4444', aura: 'rgba(249,115,22,0.16)' },
  { id: 'cobalt-forge', primary: '#3b82f6', secondary: '#06b6d4', accent: '#14b8a6', aura: 'rgba(59,130,246,0.18)' },
  { id: 'emerald-wire', primary: '#10b981', secondary: '#22c55e', accent: '#06b6d4', aura: 'rgba(16,185,129,0.16)' },
  { id: 'crimson-board', primary: '#ef4444', secondary: '#f97316', accent: '#f59e0b', aura: 'rgba(239,68,68,0.16)' },
  { id: 'amber-logic', primary: '#f59e0b', secondary: '#eab308', accent: '#84cc16', aura: 'rgba(245,158,11,0.16)' },
  { id: 'teal-signal', primary: '#14b8a6', secondary: '#2dd4bf', accent: '#38bdf8', aura: 'rgba(20,184,166,0.18)' },
  { id: 'ocean-spire', primary: '#0ea5e9', secondary: '#3b82f6', accent: '#2dd4bf', aura: 'rgba(14,165,233,0.18)' },
  { id: 'forest-ops', primary: '#22c55e', secondary: '#10b981', accent: '#84cc16', aura: 'rgba(34,197,94,0.18)' },
  { id: 'ruby-matrix', primary: '#dc2626', secondary: '#ef4444', accent: '#f97316', aura: 'rgba(220,38,38,0.16)' },
  { id: 'steel-neon', primary: '#64748b', secondary: '#06b6d4', accent: '#38bdf8', aura: 'rgba(100,116,139,0.2)' },
  { id: 'mint-vector', primary: '#34d399', secondary: '#2dd4bf', accent: '#22d3ee', aura: 'rgba(52,211,153,0.18)' },
  { id: 'sunset-rail', primary: '#fb7185', secondary: '#f97316', accent: '#f59e0b', aura: 'rgba(251,113,133,0.18)' },
  { id: 'skyline-fx', primary: '#60a5fa', secondary: '#22d3ee', accent: '#2dd4bf', aura: 'rgba(96,165,250,0.18)' },
  { id: 'lime-strike', primary: '#84cc16', secondary: '#22c55e', accent: '#14b8a6', aura: 'rgba(132,204,22,0.18)' },
  { id: 'citrus-pulse', primary: '#facc15', secondary: '#f59e0b', accent: '#fb7185', aura: 'rgba(250,204,21,0.16)' },
  { id: 'tidal-core', primary: '#06b6d4', secondary: '#0ea5e9', accent: '#2dd4bf', aura: 'rgba(6,182,212,0.18)' },
  { id: 'volt-axis', primary: '#38bdf8', secondary: '#22d3ee', accent: '#10b981', aura: 'rgba(56,189,248,0.18)' },
  { id: 'ember-link', primary: '#f97316', secondary: '#ef4444', accent: '#fb7185', aura: 'rgba(249,115,22,0.18)' },
  { id: 'pine-quant', primary: '#16a34a', secondary: '#22c55e', accent: '#2dd4bf', aura: 'rgba(22,163,74,0.18)' },
  { id: 'aqua-stack', primary: '#22d3ee', secondary: '#2dd4bf', accent: '#60a5fa', aura: 'rgba(34,211,238,0.18)' },
  { id: 'solar-guard', primary: '#f59e0b', secondary: '#f97316', accent: '#eab308', aura: 'rgba(245,158,11,0.16)' },
  { id: 'orchard-net', primary: '#4ade80', secondary: '#34d399', accent: '#84cc16', aura: 'rgba(74,222,128,0.18)' },
  { id: 'flare-scout', primary: '#fb7185', secondary: '#ef4444', accent: '#f97316', aura: 'rgba(251,113,133,0.18)' },
  { id: 'turbo-teal', primary: '#14b8a6', secondary: '#0ea5e9', accent: '#3b82f6', aura: 'rgba(20,184,166,0.18)' },
  { id: 'prairie-loop', primary: '#65a30d', secondary: '#22c55e', accent: '#facc15', aura: 'rgba(101,163,13,0.18)' },
  { id: 'horizon-lab', primary: '#0284c7', secondary: '#3b82f6', accent: '#22d3ee', aura: 'rgba(2,132,199,0.18)' },
  { id: 'copper-node', primary: '#ea580c', secondary: '#f97316', accent: '#f59e0b', aura: 'rgba(234,88,12,0.18)' },
  { id: 'rainfield', primary: '#22d3ee', secondary: '#60a5fa', accent: '#34d399', aura: 'rgba(34,211,238,0.18)' },
  { id: 'summit-control', primary: '#0d9488', secondary: '#0891b2', accent: '#10b981', aura: 'rgba(13,148,136,0.18)' },
];

const ROUTE_TO_AGENT = {
  '/': 'atlas-grid',
  '/assets': 'cobalt-forge',
  '/scan': 'ember-link',
  '/discovery': 'ocean-spire',
  '/matches': 'crimson-board',
  '/revenue': 'solar-guard',
  '/realtime': 'volt-axis',
  '/video': 'skyline-fx',
  '/prediction': 'mint-vector',
  '/watermark': 'teal-signal',
  '/propagation': 'tidal-core',
  '/comparison': 'steel-neon',
  '/identity': 'horizon-lab',
  '/geo': 'rainfield',
  '/enforcement': 'ruby-matrix',
  '/dmca': 'copper-node',
  '/licensing': 'velvet-sun',
  '/evidence': 'summit-control',
  '/compliance': 'forest-ops',
  '/reports': 'amber-logic',
};

export function getDesignAgent(pathname) {
  const key = Object.keys(ROUTE_TO_AGENT).find((route) => pathname === route || pathname.startsWith(`${route}/`));
  const routeAgentId = key ? ROUTE_TO_AGENT[key] : null;

  if (routeAgentId) {
    const exactAgent = DESIGN_AGENTS.find((agent) => agent.id === routeAgentId);
    if (exactAgent) return exactAgent;
  }

  let hash = 0;
  for (let i = 0; i < pathname.length; i += 1) {
    hash = (hash << 5) - hash + pathname.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % DESIGN_AGENTS.length;
  return DESIGN_AGENTS[index];
}

export function getDesignAgentsCount() {
  return DESIGN_AGENTS.length;
}
