import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Send,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Download,
  BarChart3,
  TrendingUp,
  Zap,
  Globe,
  Scale,
  FileCheck,
  ListChecks,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { generateDMCA, batchDMCA, getDMCAReport, getDMCAPlatforms } from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DMCAGenerator() {
  const [platforms, setPlatforms] = useState([]);
  const [report, setReport] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('generate');
  const [showNoticeText, setShowNoticeText] = useState(false);

  // Form state
  const [platform, setPlatform] = useState('youtube');
  const [assetName, setAssetName] = useState('');
  const [infringingUrl, setInfringingUrl] = useState('');
  const [ownerName, setOwnerName] = useState('AEGIS Rights Holder');
  const [similarity, setSimilarity] = useState(85);

  useEffect(() => {
    Promise.all([
      getDMCAPlatforms().catch(() => []),
      getDMCAReport().catch(() => null),
    ]).then(([plats, rep]) => {
      setPlatforms(plats);
      setReport(rep);
      setReportLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    if (!assetName.trim() || !infringingUrl.trim()) {
      toast.error('Enter asset name and infringing URL');
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const data = await generateDMCA({
        platform,
        asset_name: assetName,
        infringing_url: infringingUrl,
        owner_name: ownerName,
        similarity_score: similarity / 100,
      });
      setNotice(data);
      toast.success('DMCA notice generated');
    } catch {
      toast.error('Generation failed');
    }
    setLoading(false);
  };

  const copyNotice = () => {
    if (notice?.notice_text) {
      navigator.clipboard.writeText(notice.notice_text);
      toast.success('Notice copied to clipboard');
    }
  };

  const downloadNotice = () => {
    if (notice?.notice_text) {
      const blob = new Blob([notice.notice_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${notice.notice_id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Notice downloaded');
    }
  };

  const tabs = [
    { key: 'generate', label: 'Generate Notice', icon: FileText },
    { key: 'report', label: 'Enforcement Report', icon: BarChart3 },
    { key: 'platforms', label: 'Platform Directory', icon: Globe },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="DMCA Generator"
        subtitle="Automated legal takedown notices — court-ready documentation"
        icon={<Scale className="w-6 h-6 text-rose-400" />}
      />

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <motion.div variants={item} className="card-elevated p-6">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Generate DMCA Takedown Notice
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-dark-400 mb-1 block">Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/40 focus:outline-none appearance-none"
                >
                  {platforms.map(p => (
                    <option key={p.platform_key} value={p.platform_key}>{p.name}</option>
                  ))}
                  {platforms.length === 0 && (
                    <>
                      <option value="youtube">YouTube / Google</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="facebook">Meta (Facebook/Instagram)</option>
                      <option value="tiktok">TikTok</option>
                      <option value="telegram">Telegram</option>
                      <option value="twitch">Twitch</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dark-400 mb-1 block">Rights Holder</label>
                <input
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:border-rose-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dark-400 mb-1 block">Asset Name</label>
                <input
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  placeholder="e.g., Champions League Final 2024"
                  className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:border-rose-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dark-400 mb-1 block">Infringing URL</label>
                <input
                  value={infringingUrl}
                  onChange={e => setInfringingUrl(e.target.value)}
                  placeholder="https://example.com/pirated-content"
                  className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:border-rose-500/40 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-dark-400 mb-1 block">Similarity Score: {similarity}%</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={similarity}
                  onChange={e => setSimilarity(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              {loading ? 'Generating...' : 'Generate DMCA Notice'}
            </button>
          </motion.div>

          {/* Generated Notice */}
          <AnimatePresence>
            {notice && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="card-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{notice.notice_id}</h4>
                        <p className="text-xs text-dark-400">{notice.platform} • {notice.legal_basis}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={copyNotice} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-all" title="Copy">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={downloadNotice} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-all" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-dark-800/60 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-white">{(notice.similarity_score * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-dark-400">Match Score</p>
                    </div>
                    <div className="bg-dark-800/60 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-white">{notice.estimated_response_days}d</p>
                      <p className="text-[10px] text-dark-400">Est. Response</p>
                    </div>
                    <div className="bg-dark-800/60 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-emerald-400">{(notice.historical_success_rate * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-dark-400">Success Rate</p>
                    </div>
                    <div className="bg-dark-800/60 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-cyan-400">{notice.evidence_hash.slice(0, 8)}...</p>
                      <p className="text-[10px] text-dark-400">Evidence Hash</p>
                    </div>
                  </div>

                  {notice.submit_url && (
                    <a
                      href={notice.submit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm text-cyan-400 transition-all mb-4"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Submit to {notice.platform}
                    </a>
                  )}

                  <button
                    onClick={() => setShowNoticeText(!showNoticeText)}
                    className="text-xs text-dark-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {showNoticeText ? 'Hide' : 'Show'} Full Notice Text
                  </button>

                  <AnimatePresence>
                    {showNoticeText && (
                      <motion.pre
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 bg-dark-900 border border-dark-700 rounded-xl p-4 text-xs text-dark-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap"
                      >
                        {notice.notice_text}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {reportLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : report ? (
            <>
              <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Notices Sent', value: report.total_notices_sent, icon: Send, color: 'from-rose-500 to-rose-600' },
                  { label: 'Successful', value: report.successful_takedowns, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
                  { label: 'Pending', value: report.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
                  { label: 'Success Rate', value: `${(report.success_rate * 100).toFixed(0)}%`, icon: TrendingUp, color: 'from-violet-500 to-violet-600' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="card-elevated p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-dark-400">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Revenue recovered + content removed */}
              <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-elevated p-5 text-center">
                  <p className="text-3xl font-black text-emerald-400">${report.estimated_revenue_recovered.toLocaleString()}</p>
                  <p className="text-sm text-dark-400">Estimated Revenue Recovered</p>
                </div>
                <div className="card-elevated p-5 text-center">
                  <p className="text-3xl font-black text-cyan-400">{report.content_removed_tb} TB</p>
                  <p className="text-sm text-dark-400">Pirated Content Removed</p>
                </div>
              </motion.div>

              {/* Platform Breakdown */}
              <motion.div variants={item} className="card-elevated p-6">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Platform Breakdown
                </h4>
                <div className="space-y-3">
                  {report.platform_breakdown.map((p, i) => {
                    const maxSent = Math.max(...report.platform_breakdown.map(x => x.notices_sent), 1);
                    return (
                      <motion.div
                        key={p.platform_key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4"
                      >
                        <span className="text-sm text-dark-300 w-44 truncate">{p.platform}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-5 bg-dark-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-600 rounded-l-full" style={{ width: `${(p.successful / maxSent) * 100}%` }} />
                            <div className="h-full bg-yellow-600" style={{ width: `${(p.pending / maxSent) * 100}%` }} />
                            <div className="h-full bg-red-600 rounded-r-full" style={{ width: `${(p.failed / maxSent) * 100}%` }} />
                          </div>
                          <span className="text-xs text-dark-400 w-8 text-right">{p.notices_sent}</span>
                        </div>
                        <span className="text-xs text-emerald-400 w-12 text-right">{(p.success_rate * 100).toFixed(0)}%</span>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-dark-500">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-600" /> Successful</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-600" /> Pending</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600" /> Failed</span>
                </div>
              </motion.div>

              {/* Weekly Trend */}
              <motion.div variants={item} className="card-elevated p-6">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  Weekly Trend
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {report.weekly_trend.map((w, i) => (
                    <div key={i} className="bg-dark-800/50 rounded-xl p-4 text-center">
                      <p className="text-[10px] text-dark-500 mb-2">Week {i + 1}</p>
                      <p className="text-lg font-bold text-white">{w.sent}</p>
                      <p className="text-xs text-dark-400">sent</p>
                      <p className="text-sm font-semibold text-emerald-400 mt-1">{w.resolved}</p>
                      <p className="text-xs text-dark-400">resolved</p>
                      <p className="text-[10px] text-dark-500 mt-1">{w.avg_response_hours.toFixed(0)}h avg</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <div className="card-elevated p-8 text-center text-dark-400">No report data available</div>
          )}
        </div>
      )}

      {/* Platforms Directory Tab */}
      {activeTab === 'platforms' && (
        <motion.div variants={item} className="card-elevated p-6">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-cyan-400" />
            DMCA Submission Directory
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((p, i) => (
              <motion.div
                key={p.platform_key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-dark-800/50 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-white">{p.name}</h5>
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    p.success_rate >= 0.85 ? 'bg-emerald-500/15 text-emerald-400' :
                    p.success_rate >= 0.7 ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-red-500/15 text-red-400'
                  }`}>
                    {(p.success_rate * 100).toFixed(0)}% success
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400">Avg Response</span>
                    <span className="text-dark-200">{p.avg_response_days} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400">Email</span>
                    <span className="text-cyan-400 text-xs">{p.email}</span>
                  </div>
                </div>
                {p.submit_url && (
                  <a
                    href={p.submit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1 text-xs text-dark-400 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Submission Form
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
