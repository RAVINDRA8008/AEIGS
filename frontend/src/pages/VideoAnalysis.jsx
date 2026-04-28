import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Film,
  Scissors,
  BarChart3,
  Layers,
  Sparkles,
  Upload,
  Clock,
  Eye,
  Activity,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import PageHeader from '../components/PageHeader';
import { analyzeVideo, videoDemoAnalysis } from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function VideoAnalysis() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [activeTab, setActiveTab] = useState('upload');

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeVideo(files[0]);
      setAnalysisResult(result);
      toast.success(`Analyzed ${result.total_frames} frames`);
    } catch (err) {
      toast.error('Analysis failed');
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/gif': [], 'image/webp': [], 'image/*': [] },
    maxFiles: 1,
  });

  const handleDemoAnalysis = async () => {
    if (!demoName.trim()) {
      toast.error('Enter a video name');
      return;
    }
    setLoading(true);
    setAnalysisResult(null);
    try {
      const result = await videoDemoAnalysis(demoName);
      setAnalysisResult(result);
      toast.success('Demo analysis generated');
    } catch (err) {
      toast.error('Demo generation failed');
    }
    setLoading(false);
  };

  const tabs = [
    { key: 'upload', label: 'Upload Analysis', icon: Upload },
    { key: 'demo', label: 'Demo Mode', icon: Sparkles },
  ];

  const formatTime = (ms) => {
    const sec = ms / 1000;
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Video Intelligence"
        subtitle="Scene detection, highlight extraction, and clip matching"
        icon={<Film className="w-6 h-6 text-accent-400" />}
      />

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-aegis-600/20 text-aegis-400 border border-aegis-500/30'
                : 'bg-dark-800/40 text-dark-400 border border-dark-700/30 hover:bg-dark-800/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Upload / Demo Input */}
      <motion.div variants={item} className="card-elevated p-6">
        {activeTab === 'upload' ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-aegis-500 bg-aegis-500/5'
                : 'border-dark-600/50 hover:border-dark-500/50'
            }`}
          >
            <input {...getInputProps()} />
            <Video className="w-16 h-16 mx-auto mb-4 text-dark-500" />
            <p className="text-white font-medium">Drop a GIF/video file here or click to browse</p>
            <p className="text-sm text-dark-500 mt-1">Supports GIF, WebP, and animated images</p>
          </div>
        ) : (
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-300 mb-2">Video/Content Name</label>
              <input
                type="text"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="e.g. Premier League Highlights 2024, Champions League Final..."
                className="w-full bg-dark-800/60 border border-dark-600/50 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:border-aegis-500/50 transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDemoAnalysis}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-accent-600 to-accent-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Analyze
            </motion.button>
          </div>
        )}

        {loading && (
          <div className="mt-6 text-center">
            <Activity className="w-8 h-8 animate-spin text-aegis-400 mx-auto mb-2" />
            <p className="text-dark-400">Analyzing video content...</p>
          </div>
        )}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Frames', value: analysisResult.total_frames, icon: Film, color: 'from-blue-500 to-blue-600' },
                { label: 'Scenes Detected', value: analysisResult.scenes_detected, icon: Scissors, color: 'from-emerald-500 to-emerald-600' },
                { label: 'Highlights', value: analysisResult.highlights_detected, icon: Sparkles, color: 'from-amber-500 to-amber-600' },
                { label: 'Analysis Time', value: `${analysisResult.analysis_duration_ms || 0}ms`, icon: Clock, color: 'from-violet-500 to-violet-600' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card-elevated p-5 text-center"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} mx-auto mb-3 flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Video Stats */}
            {analysisResult.statistics && (
              <motion.div variants={item} className="card-elevated p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-aegis-400" />
                  Visual Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Avg Brightness', value: analysisResult.statistics.avg_brightness },
                    { label: 'Brightness Variance', value: analysisResult.statistics.brightness_variance },
                    { label: 'Avg Edge Density', value: analysisResult.statistics.avg_edge_density },
                    { label: 'Visual Complexity', value: analysisResult.statistics.visual_complexity },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-xs text-dark-500 mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
                {analysisResult.duration_seconds && (
                  <div className="mt-4 pt-4 border-t border-dark-700/30 flex gap-6">
                    <div><span className="text-dark-500 text-sm">Duration:</span> <span className="text-white font-medium">{analysisResult.duration_seconds}s</span></div>
                    <div><span className="text-dark-500 text-sm">FPS:</span> <span className="text-white font-medium">{analysisResult.fps}</span></div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Scene Boundaries */}
            {analysisResult.scenes?.length > 0 && (
              <motion.div variants={item} className="card-elevated p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-emerald-400" />
                  Scene Boundaries ({analysisResult.scenes.length})
                </h3>
                <div className="space-y-2">
                  {analysisResult.scenes.map((scene, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-400">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          Frame {scene.frame_index} • {formatTime(scene.timestamp_ms)}
                        </p>
                        <p className="text-xs text-dark-500">{scene.type?.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <div className="h-2 w-20 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                            style={{ width: `${(scene.change_score || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-dark-500">{((scene.change_score || 0) * 100).toFixed(0)}% change</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Highlights */}
            {analysisResult.highlights?.length > 0 && (
              <motion.div variants={item} className="card-elevated p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Key Moments ({analysisResult.highlights.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.highlights.map((hl, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          {formatTime(hl.timestamp_ms)} — Frame {hl.frame_index}
                        </p>
                        <p className="text-xs text-dark-500">
                          {hl.type?.replace(/_/g, ' ')} • Intensity: {typeof hl.intensity === 'number' ? hl.intensity.toFixed(1) : hl.intensity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Frame Timeline */}
            {analysisResult.frame_fingerprints?.length > 0 && (
              <motion.div variants={item} className="card-elevated p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  Frame Fingerprint Timeline
                </h3>
                <div className="flex items-end gap-px h-20">
                  {analysisResult.frame_fingerprints.map((fp, i) => {
                    const maxBrightness = Math.max(...analysisResult.frame_fingerprints.map(f => f.brightness || 0), 1);
                    const height = ((fp.brightness || 0) / maxBrightness) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer group relative"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`Frame ${fp.frame_index} | ${formatTime(fp.timestamp_ms)} | Brightness: ${fp.brightness}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-dark-600">
                  <span>0:00</span>
                  <span>Brightness over time</span>
                  <span>{formatTime(analysisResult.frame_fingerprints[analysisResult.frame_fingerprints.length - 1]?.timestamp_ms || 0)}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
