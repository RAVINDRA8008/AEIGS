import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanSearch,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Loader2,
  Zap,
  Image as ImageIcon,
  X,
  Globe,
  Link2,
  Files,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { scanUpload, scanURL, batchScan, compareImages } from '../services/api';
import PageHeader from '../components/PageHeader';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function Scan() {
  const [mode, setMode] = useState('scan');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);

  // URL scan
  const [scanUrl, setScanUrl] = useState('');

  // Batch scan
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResults, setBatchResults] = useState(null);

  // Compare mode
  const [compareFile1, setCompareFile1] = useState(null);
  const [compareFile2, setCompareFile2] = useState(null);
  const [comparePreview1, setComparePreview1] = useState(null);
  const [comparePreview2, setComparePreview2] = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  const onScanDrop = useCallback((files) => {
    if (files.length > 0) {
      setScanFile(files[0]);
      setScanPreview(URL.createObjectURL(files[0]));
      setResults(null);
    }
  }, []);

  const { getRootProps: getScanRootProps, getInputProps: getScanInputProps, isDragActive: isScanDragActive } = useDropzone({
    onDrop: onScanDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const onBatchDrop = useCallback((files) => {
    setBatchFiles(prev => [...prev, ...files].slice(0, 10));
    setBatchResults(null);
  }, []);

  const { getRootProps: getBatchRootProps, getInputProps: getBatchInputProps, isDragActive: isBatchDragActive } = useDropzone({
    onDrop: onBatchDrop,
    accept: { 'image/*': [] },
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
  });

  const handleScan = async () => {
    if (!scanFile) return;
    setScanning(true);
    setResults(null);
    try {
      const data = await scanUpload(scanFile);
      setResults(data);
      if (data.total_matches > 0) {
        toast.error(`${data.total_matches} violation(s) detected!`);
      } else {
        toast.success('No violations found');
      }
    } catch (err) {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleURLScan = async () => {
    if (!scanUrl.trim()) return;
    setScanning(true);
    setResults(null);
    try {
      const data = await scanURL(scanUrl.trim());
      setResults(data);
      if (data.total_matches > 0) {
        toast.error(`${data.total_matches} violation(s) detected!`);
      } else {
        toast.success('No violations found');
      }
    } catch (err) {
      toast.error('URL scan failed — check the URL');
    } finally {
      setScanning(false);
    }
  };

  const handleBatchScan = async () => {
    if (batchFiles.length === 0) return;
    setScanning(true);
    setBatchResults(null);
    try {
      const data = await batchScan(batchFiles);
      setBatchResults(data);
      const totalViolations = data.results?.reduce((sum, r) => sum + (r.total_matches || 0), 0) || 0;
      if (totalViolations > 0) {
        toast.error(`${totalViolations} violation(s) detected across ${batchFiles.length} files!`);
      } else {
        toast.success('All files clean!');
      }
    } catch (err) {
      toast.error('Batch scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleCompare = async () => {
    if (!compareFile1 || !compareFile2) return;
    setScanning(true);
    setCompareResult(null);
    try {
      const data = await compareImages(compareFile1, compareFile2);
      setCompareResult(data);
    } catch (err) {
      toast.error('Comparison failed');
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setScanFile(null);
    setScanPreview(null);
    setResults(null);
    setScanUrl('');
  };

  const getSeverityColor = (score) => {
    if (score >= 0.9) return 'text-danger-400';
    if (score >= 0.8) return 'text-warning-400';
    if (score >= 0.7) return 'text-warning-500';
    return 'text-success-400';
  };

  const getSeverityBg = (score) => {
    if (score >= 0.9) return 'bg-danger-500/10 border-danger-500/30';
    if (score >= 0.8) return 'bg-warning-500/10 border-warning-500/30';
    return 'bg-success-500/10 border-success-500/30';
  };

  const modes = [
    { id: 'scan', icon: ScanSearch, label: 'Scan Image' },
    { id: 'url', icon: Globe, label: 'Scan URL' },
    { id: 'batch', icon: Files, label: 'Batch Scan' },
    { id: 'compare', icon: Zap, label: 'Compare' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={ScanSearch}
        title="Content Scanner"
        subtitle="Detect unauthorized use of your protected assets"
      />

      {/* Mode Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 bg-dark-900/60 p-1.5 rounded-2xl w-fit border border-dark-700/30 backdrop-blur-sm"
      >
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
              ${mode === m.id ? 'text-white' : 'text-dark-500 hover:text-dark-300'}`}
          >
            {mode === m.id && (
              <motion.div
                layoutId="scan-tab"
                className="absolute inset-0 bg-gradient-to-r from-aegis-600 to-aegis-700 rounded-xl shadow-lg shadow-aegis-600/20"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <m.icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{m.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ========== SCAN IMAGE MODE ========== */}
      <AnimatePresence mode="wait">
        {mode === 'scan' && (
          <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div
                {...getScanRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                  ${isScanDragActive ? 'border-aegis-500 bg-aegis-500/5 shadow-lg shadow-aegis-500/10' : 'border-dark-700/50 bg-dark-900/30 hover:border-dark-600 hover:bg-dark-900/50'}`}
              >
                <input {...getScanInputProps()} />
                {scanPreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img src={scanPreview} alt="Scan target" className="max-h-64 rounded-xl mx-auto" />
                      {scanning && (
                        <div className="absolute inset-0 bg-dark-900/50 rounded-xl flex items-center justify-center">
                          <div className="relative w-full h-full overflow-hidden rounded-xl">
                            <div className="absolute left-0 right-0 h-0.5 bg-aegis-500 scan-line glow-blue" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-dark-400">{scanFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-dark-800 rounded-2xl flex items-center justify-center">
                      <ScanSearch className="w-10 h-10 text-dark-500" />
                    </div>
                    <div>
                      <p className="text-lg text-dark-300">Drop an image to scan</p>
                      <p className="text-sm text-dark-500 mt-1">We'll check it against all registered assets</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleScan} disabled={!scanFile || scanning}
                  className="flex-1 btn-primary justify-center py-3">
                  {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Scanning...</> : <><ScanSearch className="w-5 h-5" /> Scan Now</>}
                </motion.button>
                {scanFile && (
                  <button onClick={resetScan} className="btn-ghost px-4"><X className="w-5 h-5" /></button>
                )}
              </div>
            </div>
            <ScanResults results={results} scanning={scanning} getSeverityColor={getSeverityColor} getSeverityBg={getSeverityBg} />
          </motion.div>
        )}

        {/* ========== URL SCAN MODE ========== */}
        {mode === 'url' && (
          <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div className="section-card space-y-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-12 h-12 bg-aegis-600/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-aegis-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Scan by URL</h3>
                    <p className="text-sm text-dark-400">Paste an image URL to check against your assets</p>
                  </div>
                </div>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    className="input pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleURLScan()}
                  />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleURLScan}
                  disabled={!scanUrl.trim() || scanning}
                  className="btn-primary w-full justify-center py-3">
                  {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Scanning URL...</> : <><Globe className="w-5 h-5" /> Scan URL</>}
                </motion.button>
              </div>
            </div>
            <ScanResults results={results} scanning={scanning} getSeverityColor={getSeverityColor} getSeverityBg={getSeverityBg} />
          </motion.div>
        )}

        {/* ========== BATCH SCAN MODE ========== */}
        {mode === 'batch' && (
          <motion.div key="batch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div
                  {...getBatchRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-dark-900/50
                    ${isBatchDragActive ? 'border-aegis-500 bg-aegis-500/5' : 'border-dark-600 hover:border-dark-500'}`}
                >
                  <input {...getBatchInputProps()} />
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-dark-800 rounded-2xl flex items-center justify-center">
                      <Files className="w-8 h-8 text-dark-500" />
                    </div>
                    <p className="text-dark-300">Drop multiple images (up to 10)</p>
                    <p className="text-xs text-dark-500">{batchFiles.length} file(s) queued</p>
                  </div>
                </div>
                {batchFiles.length > 0 && (
                  <div className="section-card space-y-2 max-h-48 overflow-y-auto">
                    {batchFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1.5">
                        <span className="text-dark-300 truncate">{f.name}</span>
                        <button onClick={() => setBatchFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-dark-500 hover:text-danger-400 p-1"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleBatchScan}
                    disabled={batchFiles.length === 0 || scanning}
                    className="flex-1 btn-primary justify-center py-3">
                    {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><ScanSearch className="w-5 h-5" /> Scan All</>}
                  </motion.button>
                  {batchFiles.length > 0 && (
                    <button onClick={() => { setBatchFiles([]); setBatchResults(null); }}
                      className="btn-ghost px-4"><X className="w-5 h-5" /></button>
                  )}
                </div>
              </div>
              <div className="section-card">
                <h2 className="text-lg font-semibold text-white mb-4">Batch Results</h2>
                {batchResults ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {batchResults.results?.map((r, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${r.total_matches > 0 ? 'bg-danger-500/10 border-danger-500/30' : 'bg-success-500/10 border-success-500/30'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white truncate">{r.filename || `File ${idx + 1}`}</span>
                          <span className={`text-sm font-bold ${r.total_matches > 0 ? 'text-danger-400' : 'text-success-400'}`}>
                            {r.total_matches > 0 ? `${r.total_matches} match${r.total_matches > 1 ? 'es' : ''}` : 'Clean'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-dark-500">
                    <Files className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add files and click Scan All</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== COMPARE MODE ========== */}
        {mode === 'compare' && (
          <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadBox label="Original Image" preview={comparePreview1}
                onSelect={(f) => { setCompareFile1(f); setComparePreview1(URL.createObjectURL(f)); }} />
              <ImageUploadBox label="Suspect Image" preview={comparePreview2}
                onSelect={(f) => { setCompareFile2(f); setComparePreview2(URL.createObjectURL(f)); }} />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCompare}
              disabled={!compareFile1 || !compareFile2 || scanning}
              className="btn-primary w-full justify-center py-3">
              {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Comparing...</> : <><Zap className="w-5 h-5" /> Compare Images</>}
            </motion.button>

            <AnimatePresence>
              {compareResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="section-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Comparison Results</h3>
                    <span className={`text-3xl font-bold ${getSeverityColor(compareResult.combined_score)}`}>
                      {(compareResult.combined_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${compareResult.verdict === 'match' ? 'bg-danger-500/10 border-danger-500/30' : 'bg-success-500/10 border-success-500/30'}`}>
                    <p className={`font-semibold ${compareResult.verdict === 'match' ? 'text-danger-400' : 'text-success-400'}`}>
                      {compareResult.verdict === 'match' ? 'MATCH DETECTED — Potential Violation' : 'NO MATCH — Content appears original'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(compareResult.hash_scores || {}).map(([key, val]) => (
                      <div key={key} className="bg-dark-800/50 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-dark-500 uppercase">{key}</p>
                        <p className="text-lg font-bold text-white mt-1">{(val * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                  {compareResult.ai_comparison && compareResult.ai_comparison.similarity_assessment !== 'error' && (
                    <div className="bg-dark-800/50 rounded-xl p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-aegis-400">Gemini AI Analysis</h4>
                      <p className="text-sm text-dark-300">{compareResult.ai_comparison.details}</p>
                      {compareResult.ai_comparison.modifications_detected && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {compareResult.ai_comparison.modifications_detected.map((mod, i) => (
                            <span key={i} className="badge badge-warning">{mod}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Sub-Components ----

function ScanResults({ results, scanning, getSeverityColor, getSeverityBg }) {
  return (
    <div className="section-card">
      <h2 className="text-lg font-semibold text-white mb-4">Scan Results</h2>
      {results ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={item}
            className={`p-4 rounded-xl border ${results.total_matches > 0 ? 'bg-danger-500/10 border-danger-500/30' : 'bg-success-500/10 border-success-500/30'}`}>
            <div className="flex items-center gap-3">
              {results.total_matches > 0 ? (
                <AlertTriangle className="w-6 h-6 text-danger-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-success-400" />
              )}
              <div>
                <p className={`font-semibold ${results.total_matches > 0 ? 'text-danger-400' : 'text-success-400'}`}>
                  {results.total_matches > 0
                    ? `${results.total_matches} Violation(s) Detected`
                    : 'Content is Clean'}
                </p>
                <p className="text-sm text-dark-400">Scanned against {results.results?.length || 0} assets</p>
              </div>
            </div>
          </motion.div>

          {results.results?.filter(r => r.similarity_score > 0.5).map((result, idx) => (
            <motion.div key={idx} variants={item} className={`p-4 rounded-xl border ${getSeverityBg(result.similarity_score)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{result.asset_name}</p>
                  <p className="badge badge-warning mt-1 inline-block">{result.match_type}</p>
                </div>
                <span className={`text-2xl font-bold ${getSeverityColor(result.similarity_score)}`}>
                  {(result.similarity_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="space-y-2">
                <ScoreBar label="Hash Similarity" value={result.hash_similarity} color="bg-aegis-500" />
                <ScoreBar label="Visual Similarity" value={result.embedding_similarity} color="bg-accent-500" />
              </div>
              {result.matched && (
                <div className="mt-3 flex items-center gap-1 text-xs text-danger-400">
                  <AlertTriangle className="w-3 h-3" />
                  Flagged as potential violation
                </div>
              )}
            </motion.div>
          ))}

          {results.results?.filter(r => r.similarity_score > 0.5).length === 0 && results.total_matches === 0 && (
            <div className="text-center py-8 text-dark-500">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No similar content found in database</p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="text-center py-16 text-dark-500">
          <ScanSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Upload an image and click Scan</p>
          <p className="text-sm mt-1">Results will appear here</p>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-dark-400">{label}</span>
        <span className="text-white">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full h-1.5 bg-dark-700 rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </>
  );
}

function ImageUploadBox({ label, preview, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-dark-300">{label}</h3>
      <label className="block border-2 border-dashed border-dark-600 rounded-2xl p-8 text-center cursor-pointer hover:border-dark-500 hover:bg-dark-900/50 transition-all">
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files[0]; if (f) onSelect(f); }} />
        {preview ? (
          <img src={preview} alt={label} className="max-h-48 mx-auto rounded-xl" />
        ) : (
          <div className="space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-dark-500" />
            <p className="text-dark-400">Click to upload</p>
          </div>
        )}
      </label>
    </div>
  );
}
