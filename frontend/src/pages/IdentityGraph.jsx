import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Network, AlertTriangle, Eye, ChevronRight, Shield,
  Globe, Clock, DollarSign, Target, Zap, Link2, UserX, Radio
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function IdentityGraph() {
  const [stats, setStats] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [networkDetail, setNetworkDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('networks');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, networksRes] = await Promise.all([
        api.getIdentityStats(),
        api.getIdentityNetworks(),
      ]);
      setStats(statsRes);
      setNetworks(networksRes.networks || []);
    } catch (err) {
      toast.error('Failed to load identity data');
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkDetail = async (networkId) => {
    try {
      setSelectedNetwork(networkId);
      const res = await api.getNetworkDetail(networkId);
      setNetworkDetail(res);
    } catch (err) {
      toast.error('Failed to load network detail');
    }
  };

  const threatColors = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
  };

  const statusColors = {
    active: 'text-red-400 bg-red-500/10',
    monitoring: 'text-blue-400 bg-blue-500/10',
    partially_disrupted: 'text-yellow-400 bg-yellow-500/10',
  };

  const roleColors = {
    leader: 'text-red-400 bg-red-500/10 border-red-500/30',
    distributor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    uploader: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    're-streamer': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identity Graph"
        subtitle="Cross-platform offender network tracking & intelligence"
        icon={<Users className="w-6 h-6 text-aegis-400" />}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Networks Tracked" value={stats.total_networks_tracked} icon={Network} color="red" />
          <StatsCard title="Offenders Identified" value={stats.total_offenders_identified} icon={UserX} color="orange" />
          <StatsCard title="Cross-Platform Links" value={stats.cross_platform_links} icon={Link2} color="blue" />
          <StatsCard title="Networks Disrupted (30d)" value={stats.networks_disrupted_30d} icon={Shield} color="green" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'networks', label: 'Networks', icon: Network },
          { id: 'graph', label: 'Identity Graph', icon: Users },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-aegis-600/20 text-aegis-400 border border-aegis-500/30' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/40'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'networks' && (
        <div className="space-y-4">
          {networks.map((net, i) => (
            <motion.div
              key={net.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { setTab('graph'); loadNetworkDetail(net.id); }}
              className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5 hover:border-aegis-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Network className="w-5 h-5 text-red-400" />
                    <h3 className="text-white font-semibold">{net.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${threatColors[net.threat_level]}`}>
                      {net.threat_level}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[net.status]}`}>
                      {net.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                    <div>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Members</p>
                      <p className="text-lg font-bold text-white">{net.members}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Violations</p>
                      <p className="text-lg font-bold text-red-400">{net.total_violations.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Platforms</p>
                      <p className="text-sm text-dark-300">{net.active_platforms.slice(0, 3).join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Region</p>
                      <p className="text-sm text-dark-300">{net.primary_region}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Revenue Impact</p>
                      <p className="text-lg font-bold text-amber-400">${(net.estimated_revenue_impact / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                  {/* Coordination score bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-dark-500">Coordination Score</span>
                      <span className="text-xs text-dark-400">{(net.coordination_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${net.coordination_score * 100}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                      />
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-600 group-hover:text-aegis-400 transition-colors ml-4 flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'graph' && networkDetail && (
        <div className="space-y-6">
          {/* Network header */}
          <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{networkDetail.network.name}</h2>
                <p className="text-sm text-dark-400 mt-1">
                  {networkDetail.graph.nodes.length} members • {networkDetail.graph.edges.length} connections
                </p>
              </div>
              <button onClick={() => setTab('networks')} className="text-sm text-dark-400 hover:text-white transition-colors">
                ← All Networks
              </button>
            </div>

            {/* Linking Signals */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-dark-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-aegis-400" />
                Identity Linking Signals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {networkDetail.linking_signals.map((signal, i) => (
                  <div key={i} className="bg-dark-900/60 rounded-lg p-3 border border-dark-700/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-aegis-400">{signal.type}</span>
                      <span className="text-xs text-dark-400">{(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-dark-400">{signal.description}</p>
                    <div className="mt-2 h-1 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-aegis-500 rounded-full" style={{ width: `${signal.confidence * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Network members (identity graph nodes) */}
          <div>
            <h3 className="text-sm font-semibold text-dark-300 mb-3">Network Members — Cross-Platform Identities</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {networkDetail.graph.nodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${roleColors[node.role]}`}>
                        {node.role}
                      </span>
                      <span className="text-xs text-dark-500 font-mono">{node.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-red-400" />
                      <span className="text-xs font-bold text-red-400">Risk: {node.risk_score}</span>
                    </div>
                  </div>

                  {/* Cross-platform aliases */}
                  <div className="space-y-2">
                    {node.aliases.map((alias, j) => (
                      <div key={j} className="flex items-center justify-between bg-dark-900/40 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-dark-500" />
                          <span className="text-xs text-dark-400">{alias.platform}</span>
                          <span className="text-sm text-white font-medium">@{alias.handle}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-dark-500">{alias.followers.toLocaleString()} followers</span>
                          <span className="text-[10px] text-red-400">{alias.violations} violations</span>
                          <span className="text-[10px] text-aegis-400">{(alias.confidence * 100).toFixed(0)}% match</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Behavioral fingerprint */}
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-dark-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Peak: {node.posting_pattern.peak_hours.map(h => `${h}:00`).join(', ')}
                    </span>
                    <span>TZ: {node.posting_pattern.timezone_estimate}</span>
                    <span>Avg delay: {node.posting_pattern.avg_delay_minutes}m</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-dark-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-aegis-400" />
              Recommended Actions
            </h3>
            <div className="space-y-3">
              {networkDetail.recommended_actions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 bg-dark-900/40 rounded-lg p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                    action.priority === 'critical' ? 'bg-red-500/10 text-red-400' :
                    action.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {action.priority}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{action.action}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'graph' && !networkDetail && (
        <EmptyState
          icon={Network}
          title="Select a network"
          description="Choose a piracy network from the Networks tab to view the identity graph"
        />
      )}
    </div>
  );
}
