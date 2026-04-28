import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  Search,
  Youtube,
  Globe,
  Eye,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  Shield,
  Target,
  Zap,
  Radio,
  ExternalLink,
  Play,
  Upload,
  ScanSearch,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  getAssets,
  discoveryWebSearch,
  discoveryYouTubeSearch,
  discoverySweep,
  discoverySweepAsset,
  discoveryOverview,
} from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const riskColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const channelIcons = {
  web: Globe,
  youtube: Youtube,
  vision_api: Eye,
};

export default function ContentDiscovery() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sweepResults, setSweepResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sweep');
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    loadAssets();
    loadOverview();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await getAssets(0, 100);
      setAssets(data.assets || []);
    } catch { /* */ }
  };

  const loadOverview = async () => {
    try {
      const data = await discoveryOverview();
      setOverview(data);
    } catch { /* */ }
  };

  const runFullSweep = async () => {
    if (!selectedAsset && !searchQuery.trim()) {
      toast.error('Select an asset or enter a search query');
      return;
    }
    setLoading(true);
    setSweepResults(null);
    try {
      let results;
      if (selectedAsset) {
        results = await discoverySweepAsset(selectedAsset);
      } else {
        results = await discoverySweep({ asset_name: searchQuery.trim(), keywords: searchQuery.trim().split(' ') });
      }
      setSweepResults(results);
      toast.success(`Found ${results.total_findings} potential matches across ${Object.keys(results.channels_searched || {}).length} channels`);
    } catch (err) {
      toast.error('Sweep failed — check console for details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runWebSearch = async () => {
    if (!searchQuery.trim()) { toast.error('Enter a search query'); return; }
    setLoading(true);
    setSweepResults(null);
    try {
      const results = await discoveryWebSearch({ query: searchQuery.trim() });
      setSweepResults({
        total_findings: results.total_results,
        findings: results.results.map(r => ({ ...r, channel: 'web' })),
        channels_searched: { web_search: results.total_results },
      });
    } catch (err) { toast.error('Search failed'); console.error(err); }
    finally { setLoading(false); }
  };

  const runYouTubeSearch = async () => {
    if (!searchQuery.trim()) { toast.error('Enter a search query'); return; }
    setLoading(true);
    setSweepResults(null);
    try {
      const results = await discoveryYouTubeSearch({ query: searchQuery.trim() });
      setSweepResults({
        total_findings: results.total_results,
        findings: results.results.map(r => ({ ...r, channel: 'youtube' })),
        channels_searched: { youtube: results.total_results },
        total_views: results.total_views,
        critical_findings: results.critical_findings,
      });
    } catch (err) { toast.error('YouTube search failed'); console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <PageHeader
          icon={Radar}
          title="Content Discovery"
          subtitle="Actively hunt for pirated content across the web, YouTube, and social platforms"
        />
      </motion.div>

      {/* Capabilities Banner */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-aegis-600/20 bg-gradient-to-r from-aegis-600/10 via-dark-900/80 to-purple-600/10 p-6">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-60 h-60 bg-aegis-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aegis-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Radar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Active Threat Detection</h3>
              <p className="text-sm text-dark-400">AEGIS hunts down unauthorized copies — you don't need to wait</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {overview?.supported_channels?.map((ch, i) => (
              <div key={i} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                ch.enabled
                  ? 'bg-aegis-600/10 border-aegis-600/20 text-aegis-400'
                  : 'bg-dark-800/30 border-dark-700/20 text-dark-500'
              }`}>
                {ch.icon === 'youtube' ? <Youtube className="w-4 h-4" /> :
                 ch.icon === 'eye' ? <Eye className="w-4 h-4" /> :
                 ch.icon === 'image' ? <ScanSearch className="w-4 h-4" /> :
                 <Globe className="w-4 h-4" />}
                <span className="text-xs font-medium">{ch.name}</span>
                {ch.enabled ? <Zap className="w-3 h-3 ml-auto text-green-400" /> : null}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Search Controls */}
      <motion.div variants={item} className="section-card">
        <div className="flex gap-3 mb-4">
          {['sweep', 'web', 'youtube'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-aegis-600/20 text-aegis-400 border border-aegis-600/30'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
              }`}
            >
              {tab === 'sweep' && <><Radar className="w-4 h-4 inline mr-1.5" />Full Sweep</>}
              {tab === 'web' && <><Globe className="w-4 h-4 inline mr-1.5" />Web Search</>}
              {tab === 'youtube' && <><Youtube className="w-4 h-4 inline mr-1.5" />YouTube</>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          {activeTab === 'sweep' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-dark-400 mb-1.5">Select Protected Asset</label>
              <select
                value={selectedAsset || ''}
                onChange={e => setSelectedAsset(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-dark-800/50 border border-dark-700/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-aegis-500/50 focus:outline-none"
              >
                <option value="">— Select an asset —</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-dark-400 mb-1.5">
              {activeTab === 'sweep' ? 'Or search by keyword' : 'Search Query'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Premier League highlights, NBA final..."
              className="w-full bg-dark-800/50 border border-dark-700/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-600 focus:border-aegis-500/50 focus:outline-none"
              onKeyDown={e => { if (e.key === 'Enter') { activeTab === 'sweep' ? runFullSweep() : activeTab === 'web' ? runWebSearch() : runYouTubeSearch(); } }}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => activeTab === 'sweep' ? runFullSweep() : activeTab === 'web' ? runWebSearch() : runYouTubeSearch()}
              disabled={loading}
              className="btn-primary px-6 py-2.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Scanning...' : activeTab === 'sweep' ? 'Launch Sweep' : 'Search'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Loading Animation */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-aegis-600/20 border-t-aegis-500 animate-spin" />
              <Radar className="w-8 h-8 text-aegis-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-dark-400 mt-6 text-sm font-medium">Scanning the internet for unauthorized copies...</p>
            <p className="text-dark-600 mt-1 text-xs">Searching Google, YouTube, and Vision AI</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {sweepResults && !loading && (
        <motion.div variants={item} className="space-y-6">
          {/* Results Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="section-card p-4 text-center">
              <p className="text-3xl font-bold text-white">{sweepResults.total_findings}</p>
              <p className="text-xs text-dark-500 mt-1">Total Findings</p>
            </div>
            <div className="section-card p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{sweepResults.critical_findings || sweepResults.findings?.filter(f => f.risk_level === 'critical').length || 0}</p>
              <p className="text-xs text-dark-500 mt-1">Critical Risk</p>
            </div>
            <div className="section-card p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{Object.keys(sweepResults.channels_searched || {}).length}</p>
              <p className="text-xs text-dark-500 mt-1">Channels Searched</p>
            </div>
            <div className="section-card p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">
                {sweepResults.total_views ? `${(sweepResults.total_views / 1000).toFixed(0)}K` : '—'}
              </p>
              <p className="text-xs text-dark-500 mt-1">Total Views Found</p>
            </div>
          </div>

          {/* Findings List */}
          <div className="section-card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Discovery Results
            </h2>
            <div className="space-y-3">
              {sweepResults.findings?.map((finding, idx) => {
                const ChannelIcon = channelIcons[finding.channel] || Globe;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-800/60 transition-all border border-transparent hover:border-dark-700/30 group"
                  >
                    {/* Thumbnail or icon */}
                    <div className="flex-shrink-0">
                      {finding.thumbnail ? (
                        <img
                          src={finding.thumbnail}
                          alt=""
                          className="w-24 h-16 rounded-lg object-cover border border-dark-700/30"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-lg bg-dark-800 flex items-center justify-center border border-dark-700/30">
                          <ChannelIcon className="w-6 h-6 text-dark-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="text-sm font-medium text-white truncate flex-1">
                          {finding.title || finding.url}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${riskColors[finding.risk_level] || riskColors.medium}`}>
                          {finding.risk_level}
                        </span>
                      </div>

                      {finding.description && (
                        <p className="text-xs text-dark-500 mt-1 line-clamp-2">{finding.description}</p>
                      )}

                      {finding.snippet && (
                        <p className="text-xs text-dark-500 mt-1 line-clamp-2">{finding.snippet}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-dark-600">
                          <ChannelIcon className="w-3 h-3" />
                          {finding.channel === 'youtube' ? 'YouTube' : finding.channel === 'vision_api' ? 'Vision AI' : 'Web'}
                        </span>
                        {finding.channel_name || finding.channel_title || finding.display_url ? (
                          <span className="text-xs text-dark-500">{finding.channel_name || finding.channel_title || finding.display_url}</span>
                        ) : null}
                        {finding.view_count ? (
                          <span className="text-xs text-dark-500">{finding.view_count.toLocaleString()} views</span>
                        ) : null}
                        {finding.channel && finding.channel === 'youtube' && finding.channel_name ? (
                          <span className="text-xs text-dark-500">by {finding.channel_name}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {finding.url && (
                        <a
                          href={finding.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-all"
                          title="Open URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!sweepResults && !loading && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-dark-500">
          <div className="w-20 h-20 rounded-full bg-dark-800/50 flex items-center justify-center mb-4">
            <Radar className="w-10 h-10 opacity-30" />
          </div>
          <p className="text-lg font-medium">Ready to hunt</p>
          <p className="text-sm mt-1 text-dark-600">Select an asset or enter keywords to discover unauthorized copies</p>
        </motion.div>
      )}
    </motion.div>
  );
}
