import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Scale,
  FileWarning,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Loader2,
  Shield,
  Copy,
  BarChart3,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import AnimatedCounter from '../components/AnimatedCounter';

import {
  listEnforcements,
  getEnforcementStats,
  updateEnforcement,
  getMatches,
  generateEnforcement,
} from '../services/api';

const STATUS_CONFIG = {
  draft: { color: 'text-dark-400 bg-dark-700', icon: Clock, label: 'Draft' },
  sent: { color: 'text-blue-400 bg-blue-500/10', icon: Send, label: 'Sent' },
  acknowledged: { color: 'text-amber-400 bg-amber-500/10', icon: CheckCircle2, label: 'Acknowledged' },
  complied: { color: 'text-green-400 bg-green-500/10', icon: CheckCircle2, label: 'Complied' },
  escalated: { color: 'text-red-400 bg-red-500/10', icon: AlertTriangle, label: 'Escalated' },
};

export default function EnforcementPage() {
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionsData, statsData] = await Promise.all([
        listEnforcements(),
        getEnforcementStats(),
      ]);
      setActions(actionsData);
      setStats(statsData);
    } catch { /* */ }
    setLoading(false);
  };

  const loadMatches = async () => {
    try {
      const data = await getMatches(0, 50, 'pending');
      setMatches(data.matches || []);
      setShowGenerate(true);
    } catch { /* */ }
  };

  const handleGenerate = async (matchId, actionType) => {
    setGenerating(true);
    try {
      await generateEnforcement(matchId, actionType);
      toast.success('Enforcement action generated');
      setShowGenerate(false);
      loadData();
    } catch (err) {
      toast.error('Failed to generate action');
    }
    setGenerating(false);
  };

  const handleStatusUpdate = async (actionId, newStatus) => {
    try {
      await updateEnforcement(actionId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      loadData();
      setSelected(null);
    } catch {
      toast.error('Failed to update');
    }
  };

  const copyNotice = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Notice copied to clipboard');
  };

  const statCards = stats
    ? [
        { label: 'Total Actions', value: stats.total_actions, color: 'blue' },
        { label: 'Sent', value: stats.by_status?.sent || 0, color: 'aegis' },
        { label: 'Complied', value: stats.by_status?.complied || 0, color: 'green' },
        { label: 'Compliance Rate', value: stats.compliance_rate, color: 'amber', suffix: '%' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scale}
        title="Enforcement Center"
        subtitle="Automated DMCA takedowns, cease-and-desist notices, and compliance tracking"
      >
        <button
          onClick={loadMatches}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <FileWarning className="w-4 h-4" /> Generate Action
        </button>
      </PageHeader>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="section-card rounded-2xl p-5">
              <div className="text-xs text-dark-400 mb-2">{s.label}</div>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={s.value} />
                {s.suffix || ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate modal */}
      <AnimatePresence>
        {showGenerate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="section-card rounded-2xl p-6 border border-aegis-500/20"
          >
            <h3 className="text-lg font-semibold mb-4">
              Select a violation to take action on
            </h3>
            {matches.length === 0 ? (
              <p className="text-dark-500 text-sm">No pending violations</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{m.asset_name}</span>
                      <span className="text-xs text-dark-500 ml-2">
                        {m.platform} • {(m.similarity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerate(m.id, 'dmca')}
                        disabled={generating}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'DMCA'}
                      </button>
                      <button
                        onClick={() => handleGenerate(m.id, 'cease_desist')}
                        disabled={generating}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        C&D
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowGenerate(false)}
              className="btn-ghost text-sm mt-4"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-aegis-500" />
        </div>
      ) : actions.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No enforcement actions yet"
          description="Generate DMCA takedown notices for detected violations to start tracking compliance."
          action={{ label: 'Generate Action', onClick: loadMatches }}
        />
      ) : (
        <div className="space-y-3">
          {actions.map((a) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={a.id}
                layout
                className="section-card rounded-2xl p-5 cursor-pointer card-hover"
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                    <div>
                      <span className="text-sm font-medium">
                        {a.action_type.toUpperCase()} — {a.platform}
                      </span>
                      <span className="text-xs text-dark-500 ml-2">
                        #{a.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        a.priority === 'high'
                          ? 'bg-red-500/10 text-red-400'
                          : a.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-dark-700 text-dark-400'
                      }`}
                    >
                      {a.priority}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-dark-500 transition-transform ${
                        selected?.id === a.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {selected?.id === a.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                        {/* Notice content */}
                        <div className="bg-dark-800/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-dark-400 font-medium">
                              Notice Content
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyNotice(a.notice_content);
                              }}
                              className="text-xs text-aegis-400 hover:text-aegis-300 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <pre className="text-xs text-dark-300 whitespace-pre-wrap font-mono">
                            {a.notice_content}
                          </pre>
                        </div>

                        {/* Status actions */}
                        <div className="flex flex-wrap gap-2">
                          {a.status === 'draft' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(a.id, 'sent');
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            >
                              Mark as Sent
                            </button>
                          )}
                          {a.status === 'sent' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(a.id, 'acknowledged');
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                              >
                                Acknowledged
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(a.id, 'complied');
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20"
                              >
                                Complied
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(a.id, 'escalated');
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              >
                                Escalate
                              </button>
                            </>
                          )}
                        </div>

                        <div className="text-xs text-dark-500">
                          Generated: {new Date(a.generated_at).toLocaleString()}
                          {a.sent_at && ` • Sent: ${new Date(a.sent_at).toLocaleString()}`}
                          {a.resolved_at && ` • Resolved: ${new Date(a.resolved_at).toLocaleString()}`}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
