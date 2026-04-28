import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Shield,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMatches, updateMatchStatus, bulkUpdateMatches } from '../services/api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [statusFilter, typeFilter]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await getMatches(0, 100, statusFilter, typeFilter);
      setMatches(data.matches);
      setTotal(data.total);
      setSelected(new Set());
    } catch (err) {
      toast.error('Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (matchId, newStatus) => {
    try {
      await updateMatchStatus(matchId, newStatus);
      toast.success(`Marked as ${newStatus}`);
      loadMatches();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkAction = async (status) => {
    if (selected.size === 0) return;
    setBulkActing(true);
    try {
      await bulkUpdateMatches(Array.from(selected), status);
      toast.success(`${selected.size} violation(s) marked as ${status}`);
      loadMatches();
    } catch (err) {
      toast.error('Bulk update failed');
    } finally {
      setBulkActing(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === matches.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(matches.map(m => m.id)));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-danger-400" />;
      case 'dismissed': return <XCircle className="w-4 h-4 text-success-400" />;
      default: return <Clock className="w-4 h-4 text-warning-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return 'badge-danger';
      case 'dismissed': return 'badge-success';
      default: return 'badge-warning';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'exact': return 'badge-danger';
      case 'near-duplicate': return 'badge-warning';
      case 'derivative': return 'badge-info';
      case 'modified': return 'badge-accent';
      default: return 'bg-dark-600 text-dark-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-9 w-44 mb-2" />
        <div className="skeleton h-5 w-60" />
        <div className="flex gap-3 flex-wrap">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 w-24" />)}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={AlertTriangle}
        title="Violations"
        subtitle={`${total} detected violation${total !== 1 ? 's' : ''} total`}
      />

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 text-sm text-dark-500 font-medium">
          <Filter className="w-4 h-4" /> Status:
        </div>
        {[null, 'pending', 'confirmed', 'dismissed'].map((status) => (
          <button key={status || 'all'} onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${statusFilter === status
                ? 'bg-aegis-600/15 text-aegis-400 border-aegis-600/25 shadow-sm shadow-aegis-600/10'
                : 'bg-dark-900/50 text-dark-500 border-dark-700/30 hover:border-dark-600 hover:text-dark-300'}`}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </button>
        ))}
        <div className="w-px h-8 bg-dark-700/30 mx-1" />
        <div className="flex items-center gap-2 text-sm text-dark-500 font-medium">Type:</div>
        {[null, 'exact', 'near-duplicate', 'derivative', 'modified'].map((type) => (
          <button key={type || 'all'} onClick={() => setTypeFilter(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${typeFilter === type
                ? 'bg-aegis-600/15 text-aegis-400 border-aegis-600/25 shadow-sm shadow-aegis-600/10'
                : 'bg-dark-900/50 text-dark-500 border-dark-700/30 hover:border-dark-600 hover:text-dark-300'}`}>
            {type || 'All'}
          </button>
        ))}
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-aegis-600/10 border border-aegis-600/20"
          >
            <span className="text-sm text-aegis-400 font-medium">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleBulkAction('confirmed')} disabled={bulkActing}
                className="btn-danger text-xs py-1.5 px-3">
                {bulkActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Confirm All
              </button>
              <button onClick={() => handleBulkAction('dismissed')} disabled={bulkActing}
                className="btn-secondary text-xs py-1.5 px-3">
                Dismiss All
              </button>
              <button onClick={() => setSelected(new Set())} className="btn-ghost text-xs">
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All */}
      {matches.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={toggleSelectAll}
            className="text-dark-500 hover:text-dark-300 transition-colors p-1">
            {selected.size === matches.length ? (
              <CheckSquare className="w-4 h-4 text-aegis-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs text-dark-500">
            {selected.size === matches.length ? 'Deselect all' : 'Select all'}
          </span>
        </div>
      )}

      {/* Matches List */}
      {matches.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {matches.map((match) => (
            <motion.div
              key={match.id}
              variants={item}
              layout
              className={`section-card p-5 transition-all ${
                selected.has(match.id) ? 'ring-1 ring-aegis-500/30 bg-aegis-600/5 border-aegis-600/20' : 'hover:border-dark-600/60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button onClick={() => toggleSelect(match.id)}
                  className="mt-1 text-dark-500 hover:text-aegis-400 transition-colors flex-shrink-0">
                  {selected.has(match.id) ? (
                    <CheckSquare className="w-5 h-5 text-aegis-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Thumbnail */}
                {match.matched_file_path && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-800 flex-shrink-0">
                    <img src={match.matched_file_path} alt="Match"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-white font-semibold">{match.asset_name}</h3>
                      <p className="text-sm text-dark-500 mt-0.5">
                        {match.platform} • {new Date(match.detected_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-2xl font-bold ${
                        match.similarity_score >= 0.9 ? 'text-danger-400' :
                        match.similarity_score >= 0.8 ? 'text-warning-400' :
                        match.similarity_score >= 0.7 ? 'text-warning-500' : 'text-success-400'
                      }`}>
                        {(match.similarity_score * 100).toFixed(1)}%
                      </span>
                      <p className="text-[11px] text-dark-600">similarity</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className={`badge ${getTypeBadge(match.match_type)}`}>{match.match_type}</span>
                    <span className={`badge ${getStatusBadge(match.status)} flex items-center gap-1`}>
                      {getStatusIcon(match.status)} {match.status}
                    </span>
                  </div>

                  {/* Score Bars */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-dark-500">Hash</span>
                        <span className="text-dark-300">{(match.hash_similarity * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${match.hash_similarity * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="h-full bg-aegis-500 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-dark-500">Visual</span>
                        <span className="text-dark-300">{(match.embedding_similarity * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${match.embedding_similarity * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          className="h-full bg-accent-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {match.status === 'pending' && (
                      <>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => handleUpdateStatus(match.id, 'confirmed')}
                          className="btn-danger text-xs py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Confirm
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => handleUpdateStatus(match.id, 'dismissed')}
                          className="btn-ghost text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </motion.button>
                      </>
                    )}
                    {match.status === 'confirmed' && (
                      <button onClick={() => handleUpdateStatus(match.id, 'dismissed')}
                        className="btn-ghost text-xs">Dismiss</button>
                    )}
                    {match.status === 'dismissed' && (
                      <button onClick={() => handleUpdateStatus(match.id, 'pending')}
                        className="btn-ghost text-xs">Reopen</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={Shield}
          title="No violations found"
          description={statusFilter || typeFilter ? 'Try adjusting your filters' : 'Scan content to detect violations'}
        />
      )}
    </div>
  );
}
