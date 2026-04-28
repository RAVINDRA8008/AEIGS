import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  ArrowRightLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Fingerprint,
  Layers,
  Palette,
  Cpu,
  Search,
  FileWarning,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { compareContent, batchCompare } from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const verdictStyles = {
  confirmed_match: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', label: 'Confirmed Match', icon: XCircle },
  probable_match: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Probable Match', icon: AlertTriangle },
  possible_match: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Possible Match', icon: Eye },
  unlikely_match: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Unlikely Match', icon: CheckCircle2 },
};

const dimIcons = {
  perceptual_hash: Fingerprint,
  structural: Layers,
  color_histogram: Palette,
  keypoint_matching: Search,
  neural_embedding: Cpu,
  texture_analysis: Eye,
};

const severityColor = { low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-red-400' };

export default function ContentComparison() {
  const [originalName, setOriginalName] = useState('');
  const [suspectName, setSuspectName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');

  // Batch state
  const [batchSuspects, setBatchSuspects] = useState('');
  const [batchResult, setBatchResult] = useState(null);

  const handleCompare = async () => {
    if (!originalName.trim() || !suspectName.trim()) {
      toast.error('Enter both original and suspect names');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await compareContent(originalName, suspectName);
      setResult(data);
      toast.success(`Analysis complete — ${data.verdict.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Comparison failed');
    }
    setLoading(false);
  };

  const handleBatchCompare = async () => {
    if (!originalName.trim() || !batchSuspects.trim()) {
      toast.error('Enter original name and suspect list');
      return;
    }
    setLoading(true);
    setBatchResult(null);
    try {
      const suspects = batchSuspects.split('\n').map(s => s.trim()).filter(Boolean);
      const data = await batchCompare(originalName, suspects);
      setBatchResult(data);
      toast.success(`Compared against ${data.total_suspects} suspects`);
    } catch {
      toast.error('Batch comparison failed');
    }
    setLoading(false);
  };

  const tabs = [
    { key: 'single', label: 'Single Comparison', icon: ArrowRightLeft },
    { key: 'batch', label: 'Batch Compare', icon: Layers },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Content Comparison"
        subtitle="Forensic side-by-side analysis — detect modifications and prove matches"
        icon={<GitCompare className="w-6 h-6 text-amber-400" />}
      />

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Input Section */}
      <motion.div variants={item} className="card-elevated p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-dark-400 mb-1 block">Original Asset Name</label>
            <input
              value={originalName}
              onChange={e => setOriginalName(e.target.value)}
              placeholder="e.g., Premier League Final 2024"
              className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:border-amber-500/40 focus:outline-none"
            />
          </div>
          {activeTab === 'single' ? (
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1 block">Suspect Content Name</label>
              <input
                value={suspectName}
                onChange={e => setSuspectName(e.target.value)}
                placeholder="e.g., PL_Final_stream_copy.mp4"
                className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:border-amber-500/40 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1 block">Suspects (one per line)</label>
              <textarea
                value={batchSuspects}
                onChange={e => setBatchSuspects(e.target.value)}
                rows={3}
                placeholder={"suspect_1.mp4\nsuspect_2.jpg\npirate_copy.mp4"}
                className="w-full bg-dark-800/60 border border-dark-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:border-amber-500/40 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
        <button
          onClick={activeTab === 'single' ? handleCompare : handleBatchCompare}
          disabled={loading}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Run Forensic Analysis'}
        </button>
      </motion.div>

      {/* Loading animation */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-dark-700 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-dark-300 text-sm">Running multi-dimensional forensic analysis...</p>
            <div className="flex gap-6 text-xs text-dark-500">
              {['Perceptual Hashing', 'SSIM Analysis', 'Neural Embedding', 'Keypoint Matching'].map((s, i) => (
                <motion.span key={s} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}>
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Single Comparison Result */}
      <AnimatePresence>
        {result && activeTab === 'single' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Verdict Banner */}
            {(() => {
              const v = verdictStyles[result.verdict] || verdictStyles.possible_match;
              const VIcon = v.icon;
              return (
                <motion.div variants={item} className={`${v.bg} border ${v.border} rounded-2xl p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${v.bg} flex items-center justify-center`}>
                        <VIcon className={`w-7 h-7 ${v.text}`} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${v.text}`}>{v.label}</h3>
                        <p className="text-sm text-dark-400">
                          {(result.overall_similarity * 100).toFixed(1)}% overall similarity • {result.confidence * 100}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white">{(result.overall_similarity * 100).toFixed(1)}%</p>
                      <p className="text-xs text-dark-400">Match Score</p>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* File Info */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Original', data: result.original, color: 'emerald' },
                { label: 'Suspect', data: result.suspect, color: 'red' },
              ].map(side => (
                <div key={side.label} className="card-elevated p-5">
                  <p className={`text-xs font-semibold text-${side.color}-400 mb-2`}>{side.label}</p>
                  <p className="text-white font-medium truncate">{side.data.name}</p>
                  <div className="flex gap-4 mt-2 text-xs text-dark-400">
                    <span>{side.data.resolution}</span>
                    <span>{side.data.format}</span>
                    <span>{side.data.file_size_mb} MB</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Similarity Dimensions */}
            <motion.div variants={item} className="card-elevated p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                Similarity Dimensions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(result.dimensions).map(([key, dim]) => {
                  const DIcon = dimIcons[key] || Eye;
                  const pct = dim.score * 100;
                  const barColor = pct > 85 ? 'from-red-500 to-red-600' : pct > 70 ? 'from-orange-500 to-orange-600' : pct > 50 ? 'from-yellow-500 to-yellow-600' : 'from-emerald-500 to-emerald-600';
                  return (
                    <div key={key} className="bg-dark-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DIcon className="w-4 h-4 text-dark-400" />
                        <span className="text-xs font-medium text-dark-300 capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-end gap-3 mb-1">
                        <span className="text-2xl font-bold text-white">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                        />
                      </div>
                      <p className="text-[10px] text-dark-500">{dim.method}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Modifications Detected */}
            <motion.div variants={item} className="card-elevated p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-orange-400" />
                Modifications Detected ({result.modifications_detected.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.modifications_detected.map((mod, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-dark-800/50 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <AlertTriangle className={`w-4 h-4 ${severityColor[mod.severity]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white capitalize">{mod.type.replace(/_/g, ' ')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${severityColor[mod.severity]} bg-dark-700`}>
                          {mod.severity}
                        </span>
                      </div>
                      <p className="text-xs text-dark-400">{mod.description}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="w-12 h-1 bg-dark-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${mod.confidence * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-dark-500">{(mod.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Forensic Notes */}
            {result.forensic_notes?.length > 0 && (
              <motion.div variants={item} className="card-elevated p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  Forensic Assessment
                </h4>
                <div className="space-y-2">
                  {result.forensic_notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-dark-300">{note}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Result */}
      <AnimatePresence>
        {batchResult && activeTab === 'batch' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <motion.div variants={item} className="grid grid-cols-3 gap-4">
              <div className="card-elevated p-5 text-center">
                <p className="text-2xl font-bold text-white">{batchResult.total_suspects}</p>
                <p className="text-xs text-dark-400">Total Compared</p>
              </div>
              <div className="card-elevated p-5 text-center">
                <p className="text-2xl font-bold text-red-400">{batchResult.confirmed_matches}</p>
                <p className="text-xs text-dark-400">Confirmed Matches</p>
              </div>
              <div className="card-elevated p-5 text-center">
                <p className="text-2xl font-bold text-orange-400">{batchResult.probable_matches}</p>
                <p className="text-xs text-dark-400">Probable Matches</p>
              </div>
            </motion.div>

            <motion.div variants={item} className="card-elevated p-6">
              <h4 className="font-bold text-white mb-4">Comparison Results</h4>
              <div className="space-y-2">
                {batchResult.comparisons.map((c, i) => {
                  const v = verdictStyles[c.verdict] || verdictStyles.possible_match;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between py-3 px-4 bg-dark-800/40 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-dark-500 w-4">{i + 1}</span>
                        <span className="text-sm text-dark-200">{c.suspect_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {c.top_modification && (
                          <span className="text-xs text-dark-500 capitalize">{c.top_modification.replace(/_/g, ' ')}</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-lg ${v.bg} ${v.text}`}>
                          {v.label}
                        </span>
                        <span className="text-sm font-bold text-white w-14 text-right">
                          {(c.overall_similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
