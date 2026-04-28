import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Network,
  Globe,
  Eye,
  TrendingUp,
  ArrowRight,
  Loader2,
  Activity,
  Users,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import AnimatedCounter from '../components/AnimatedCounter';

import {
  getPropagationOverview,
  getPropagationTree,
  getAssets,
} from '../services/api';

const PLATFORM_COLORS = {
  'youtube.com': 'bg-red-500/10 text-red-400 border-red-500/20',
  'facebook.com': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'instagram.com': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'twitter.com': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'x.com': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'tiktok.com': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'reddit.com': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  default: 'bg-dark-700 text-dark-300 border-dark-600',
};

export default function PropagationPage() {
  const [overview, setOverview] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await getPropagationOverview();
      setOverview(data);
    } catch { /* */ }
    setLoading(false);
  };

  const loadTree = async (assetId) => {
    setTreeLoading(true);
    try {
      const data = await getPropagationTree(assetId);
      setTree(data);
      setSelectedAsset(assetId);
    } catch {
      toast.error('Failed to load propagation tree');
    }
    setTreeLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-aegis-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Network}
        title="Content Propagation"
        subtitle="Track how your protected content spreads across platforms — content lineage intelligence"
      />

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="section-card rounded-2xl p-5">
            <div className="text-xs text-dark-400 mb-2">Total Nodes</div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={overview.total_nodes} />
            </div>
          </div>
          <div className="section-card rounded-2xl p-5">
            <div className="text-xs text-dark-400 mb-2">Assets Affected</div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={overview.assets_affected} />
            </div>
          </div>
          <div className="section-card rounded-2xl p-5">
            <div className="text-xs text-dark-400 mb-2">Total Reach</div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={overview.total_reach} />
            </div>
          </div>
          <div className="section-card rounded-2xl p-5">
            <div className="text-xs text-dark-400 mb-2">Platforms</div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={Object.keys(overview.platforms || {}).length} />
            </div>
          </div>
        </div>
      )}

      {/* Platform distribution */}
      {overview?.platforms && Object.keys(overview.platforms).length > 0 && (
        <div className="section-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4">
            Platform Distribution
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(overview.platforms).map(([platform, count]) => {
              const colors =
                PLATFORM_COLORS[platform.toLowerCase()] ||
                PLATFORM_COLORS.default;
              return (
                <div
                  key={platform}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${colors}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{platform}</span>
                  <span className="text-xs opacity-70">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top spreading assets */}
      {overview?.top_spreading_assets?.length > 0 ? (
        <div className="section-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4">
            Top Spreading Assets
          </h3>
          <div className="space-y-2">
            {overview.top_spreading_assets.map((a) => (
              <button
                key={a.asset_id}
                onClick={() => loadTree(a.asset_id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  selectedAsset === a.asset_id
                    ? 'bg-aegis-600/10 border border-aegis-500/20'
                    : 'bg-dark-800/30 hover:bg-dark-700/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{a.asset_name}</div>
                    <div className="text-xs text-dark-500">
                      {a.nodes} detection nodes • {a.reach.toLocaleString()}{' '}
                      estimated reach
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-dark-500" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Network}
          title="No propagation data yet"
          description="Propagation nodes are created when matches are tracked. Scan for violations and track their spread."
        />
      )}

      {/* Propagation tree */}
      {treeLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-aegis-500" />
        </div>
      ) : (
        tree && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">{tree.asset_name}</h3>
                <p className="text-sm text-dark-500">
                  {tree.total_nodes} nodes across{' '}
                  {tree.platforms_affected.length} platforms •{' '}
                  {tree.total_reach.toLocaleString()} estimated reach
                </p>
              </div>
              <div className="flex gap-2">
                {tree.platforms_affected.map((p) => {
                  const colors =
                    PLATFORM_COLORS[p.toLowerCase()] ||
                    PLATFORM_COLORS.default;
                  return (
                    <span
                      key={p}
                      className={`text-xs px-2 py-1 rounded-lg border ${colors}`}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Content lineage visualization */}
            <div className="relative pl-8 space-y-0">
              {tree.nodes.map((node, i) => (
                <div key={node.id} className="relative pb-6 last:pb-0">
                  {/* Vertical line */}
                  {i < tree.nodes.length - 1 && (
                    <div className="absolute left-0 top-6 bottom-0 w-px bg-dark-700" />
                  )}
                  {/* Dot */}
                  <div
                    className={`absolute left-0 top-2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
                      i === 0
                        ? 'bg-aegis-500 border-aegis-400'
                        : 'bg-dark-700 border-dark-600'
                    }`}
                  />
                  {/* Card */}
                  <div className="ml-6 p-4 rounded-xl bg-dark-800/40 border border-dark-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-dark-400" />
                        {node.platform}
                      </span>
                      <span className="text-xs text-dark-500">
                        {new Date(node.detected_at).toLocaleDateString()}
                      </span>
                    </div>
                    {node.url && (
                      <div className="text-xs text-aegis-400 truncate mb-1">
                        {node.url}
                      </div>
                    )}
                    <div className="flex gap-4 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Velocity: {node.spread_velocity.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Reach: {node.reach_estimate.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )
      )}
    </div>
  );
}
