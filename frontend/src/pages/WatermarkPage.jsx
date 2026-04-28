import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Dna,
  Upload,
  Shield,
  ShieldCheck,
  ShieldX,
  Download,
  History,
  Fingerprint,
  Loader2,
  Search,
  User,
  FileText,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

import {
  embedWatermark,
  verifyWatermark,
  getAssets,
  getWatermarkHistory,
} from '../services/api';

export default function WatermarkPage() {
  const [tab, setTab] = useState('embed'); // embed | verify | history
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const loadAssets = async () => {
    if (assetsLoaded) return;
    try {
      const data = await getAssets(0, 200);
      setAssets(data.assets || []);
      setAssetsLoaded(true);
    } catch { /* ignore */ }
  };

  const handleEmbed = async () => {
    if (!selectedAsset) return toast.error('Select an asset first');
    setLoading(true);
    try {
      const data = await embedWatermark(selectedAsset.id, recipient, purpose);
      setResult({ type: 'embed', data });
      toast.success('Digital DNA watermark embedded');
    } catch (err) {
      toast.error('Failed to embed watermark');
    } finally {
      setLoading(false);
    }
  };

  // Verify drop
  const onVerifyDrop = useCallback(async (files) => {
    if (!files.length) return;
    setLoading(true);
    try {
      const data = await verifyWatermark(files[0]);
      setResult({ type: 'verify', data });
      if (data.watermark_detected) {
        toast.success('Watermark detected!');
      } else {
        toast('No watermark found in this image', { icon: '🔍' });
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps: getVerifyProps, getInputProps: getVerifyInput, isDragActive: isVerifyDrag } =
    useDropzone({ onDrop: onVerifyDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  const loadHistory = async (assetId) => {
    try {
      const data = await getWatermarkHistory(assetId);
      setHistory(data);
    } catch { /* */ }
  };

  const tabs = [
    { id: 'embed', label: 'Embed DNA', icon: Dna },
    { id: 'verify', label: 'Verify', icon: Search },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Dna}
        title="Digital DNA Watermarking"
        subtitle="Embed invisible watermarks to trace leaked content back to the exact recipient"
      />

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-800/50 rounded-2xl p-1.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setResult(null);
              if (t.id === 'embed') loadAssets();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-aegis-600 to-accent-600 text-white shadow-lg'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- EMBED TAB ---------- */}
      <AnimatePresence mode="wait">
        {tab === 'embed' && (
          <motion.div
            key="embed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Asset selection */}
            <div className="section-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-dark-300 mb-4">
                1. Select Asset
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
                {assets.length === 0 ? (
                  <p className="text-dark-500 text-sm">
                    No assets registered yet
                  </p>
                ) : (
                  assets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAsset(a)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        selectedAsset?.id === a.id
                          ? 'bg-aegis-600/20 border border-aegis-500/30'
                          : 'hover:bg-dark-700/50 border border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                        {a.file_path && (
                          <img
                            src={a.file_path}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium truncate">
                          {a.name}
                        </div>
                        <div className="text-xs text-dark-500">
                          {a.organization}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Recipient & embed */}
            <div className="section-card rounded-2xl p-6 flex flex-col">
              <h3 className="text-sm font-semibold text-dark-300 mb-4">
                2. Recipient Details
              </h3>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">
                    Recipient / Licensee
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. ESPN, Sky Sports"
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">
                    Purpose
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Broadcast preview, Review copy"
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleEmbed}
                disabled={loading || !selectedAsset}
                className="btn-primary w-full mt-6 py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Fingerprint className="w-4 h-4" />
                )}
                Embed Digital DNA
              </button>
            </div>

            {/* Result */}
            {result?.type === 'embed' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 section-card rounded-2xl p-6 border border-green-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-semibold">
                    Watermark Embedded Successfully
                  </h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-dark-500">Watermark UID</span>
                    <p className="font-mono text-aegis-400 mt-1">
                      {result.data.watermark_uid}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-500">Recipient</span>
                    <p className="mt-1">{result.data.recipient || '—'}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Purpose</span>
                    <p className="mt-1">{result.data.purpose || '—'}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ---------- VERIFY TAB ---------- */}
        {tab === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div
              {...getVerifyProps()}
              className={`section-card rounded-2xl p-12 text-center cursor-pointer transition-all border-2 border-dashed ${
                isVerifyDrag
                  ? 'border-aegis-500 bg-aegis-500/5'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <input {...getVerifyInput()} />
              <Upload className="w-10 h-10 text-dark-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Drop an image to verify
              </h3>
              <p className="text-sm text-dark-500">
                Check if an image contains an AEGIS Digital DNA watermark
              </p>
            </div>

            {result?.type === 'verify' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`section-card rounded-2xl p-6 border ${
                  result.data.watermark_detected
                    ? 'border-green-500/20'
                    : 'border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {result.data.watermark_detected ? (
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                  ) : (
                    <ShieldX className="w-6 h-6 text-amber-400" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {result.data.watermark_detected
                      ? 'Watermark Detected'
                      : 'No Watermark Found'}
                  </h3>
                </div>
                {result.data.watermark_detected && (
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-dark-500">UID</span>
                      <p className="font-mono text-aegis-400 mt-1">
                        {result.data.watermark_uid}
                      </p>
                    </div>
                    <div>
                      <span className="text-dark-500">Asset</span>
                      <p className="mt-1">{result.data.asset_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-dark-500">Recipient</span>
                      <p className="mt-1">{result.data.recipient || '—'}</p>
                    </div>
                    <div>
                      <span className="text-dark-500">Confidence</span>
                      <p className="mt-1">
                        {(result.data.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ---------- HISTORY TAB ---------- */}
        {tab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {history.length === 0 ? (
              <EmptyState
                icon={History}
                title="No watermark history"
                description="Embed watermarks into your assets to see their distribution history here."
              />
            ) : (
              <div className="section-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700 text-dark-400 text-left">
                      <th className="px-5 py-3 font-medium">UID</th>
                      <th className="px-5 py-3 font-medium">Recipient</th>
                      <th className="px-5 py-3 font-medium">Purpose</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-dark-800 hover:bg-dark-700/30"
                      >
                        <td className="px-5 py-3 font-mono text-aegis-400">
                          {h.watermark_uid}
                        </td>
                        <td className="px-5 py-3">{h.recipient || '—'}</td>
                        <td className="px-5 py-3 text-dark-400">
                          {h.purpose || '—'}
                        </td>
                        <td className="px-5 py-3 text-dark-500">
                          {new Date(h.embedded_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
