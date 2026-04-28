import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Activity,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Target,
  Radar,
  Send,
  Eye,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { runPipeline, simulateLeak, getAssets } from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stageIcons = {
  ingestion: Radio,
  preprocessing: Eye,
  hash_generation: Shield,
  embedding_generation: Zap,
  vector_search: Radar,
  hash_comparison: Target,
  similarity_scoring: TrendingUp,
  watermark_check: Shield,
  risk_assessment: AlertTriangle,
  match_decision: CheckCircle2,
  alert_generation: Send,
};

const stageColors = {
  ingestion: 'from-blue-500 to-blue-600',
  preprocessing: 'from-cyan-500 to-cyan-600',
  hash_generation: 'from-emerald-500 to-emerald-600',
  embedding_generation: 'from-violet-500 to-violet-600',
  vector_search: 'from-amber-500 to-amber-600',
  hash_comparison: 'from-rose-500 to-rose-600',
  similarity_scoring: 'from-pink-500 to-pink-600',
  watermark_check: 'from-teal-500 to-teal-600',
  risk_assessment: 'from-orange-500 to-orange-600',
  match_decision: 'from-green-500 to-green-600',
  alert_generation: 'from-red-500 to-red-600',
};

export default function RealtimeMonitor() {
  const [events, setEvents] = useState([]);
  const [pipelineResult, setPipelineResult] = useState(null);
  const [leakSimulation, setLeakSimulation] = useState(null);
  const [running, setRunning] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assets, setAssets] = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const eventSource = useRef(null);
  const eventsEndRef = useRef(null);

  useEffect(() => {
    getAssets(0, 20).then(d => setAssets(d.assets || [])).catch(() => {});
  }, []);

  // Connect to SSE
  useEffect(() => {
    const es = new EventSource('/api/realtime/stream');
    eventSource.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') return;

        setEvents(prev => [...prev.slice(-100), data]);

        if (data.type === 'stage_start') {
          setActiveStage(data.stage);
          setProgress(data.data?.progress || 0);
        }
        if (data.type === 'stage_complete') {
          setProgress(data.data?.progress || 0);
        }
        if (data.type === 'pipeline_complete') {
          setActiveStage(null);
          setProgress(100);
        }
      } catch (err) { /* ignore parse errors */ }
    };

    es.onerror = () => {
      // Reconnect after delay
      setTimeout(() => {
        if (eventSource.current) {
          eventSource.current.close();
          eventSource.current = new EventSource('/api/realtime/stream');
        }
      }, 3000);
    };

    return () => es.close();
  }, []);

  // Auto-scroll events
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleRunPipeline = async () => {
    if (!assetName.trim()) {
      toast.error('Enter an asset name to analyze');
      return;
    }
    setRunning(true);
    setPipelineResult(null);
    setEvents([]);
    setProgress(0);
    setActiveStage(null);
    try {
      const result = await runPipeline(assetName);
      setPipelineResult(result);
      toast.success(`Pipeline completed in ${result.total_duration_ms}ms`);
    } catch (err) {
      toast.error('Pipeline failed');
    }
    setRunning(false);
  };

  const handleSimulateLeak = async () => {
    if (!assetName.trim()) {
      toast.error('Enter an asset name');
      return;
    }
    setSimulating(true);
    setLeakSimulation(null);
    setEvents([]);
    try {
      const result = await simulateLeak(assetName);
      setLeakSimulation(result);
      toast.success('Leak simulation complete');
    } catch (err) {
      toast.error('Simulation failed');
    }
    setSimulating(false);
  };

  const getEventIcon = (event) => {
    if (event.type === 'leak_simulation') {
      if (event.stage === 'leak_detected') return AlertTriangle;
      if (event.stage === 'source_identified') return Target;
      if (event.stage === 'enforcement_initiated') return Shield;
      return Radio;
    }
    return stageIcons[event.stage] || Activity;
  };

  const getEventColor = (event) => {
    if (event.type === 'leak_simulation') {
      if (event.stage === 'leak_detected') return 'text-red-400';
      if (event.stage === 'spreading') return 'text-amber-400';
      if (event.stage === 'source_identified') return 'text-emerald-400';
      if (event.stage === 'enforcement_initiated') return 'text-blue-400';
    }
    if (event.type === 'pipeline_complete') return 'text-emerald-400';
    if (event.type === 'stage_complete') return 'text-aegis-400';
    return 'text-dark-400';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Real-Time Monitor"
        subtitle="Live detection pipeline with streaming intelligence"
        icon={<Radio className="w-6 h-6 text-aegis-400" />}
      />

      {/* Controls */}
      <motion.div variants={item} className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-dark-300 mb-2">Asset Name</label>
            <div className="relative">
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Enter asset name or select from registered assets..."
                className="w-full bg-dark-800/60 border border-dark-600/50 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:border-aegis-500/50 focus:ring-1 focus:ring-aegis-500/20 transition-all"
                list="asset-suggestions"
              />
              <datalist id="asset-suggestions">
                {assets.map(a => <option key={a.id} value={a.name} />)}
              </datalist>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRunPipeline}
              disabled={running || simulating}
              className="px-6 py-3 bg-gradient-to-r from-aegis-600 to-aegis-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-aegis-600/20 hover:shadow-aegis-600/40 transition-shadow"
            >
              {running ? (
                <><Activity className="w-4 h-4 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4" /> Run Pipeline</>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSimulateLeak}
              disabled={running || simulating}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-shadow"
            >
              {simulating ? (
                <><Activity className="w-4 h-4 animate-spin" /> Simulating...</>
              ) : (
                <><Zap className="w-4 h-4" /> Simulate Leak</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        {(running || progress > 0) && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-dark-400">{activeStage ? `Processing: ${activeStage}` : 'Pipeline'}</span>
              <span className="text-aegis-400 font-mono">{progress}%</span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-aegis-500 to-aegis-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Event Feed */}
        <motion.div variants={item} className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg font-bold text-white">Live Event Feed</h3>
            <span className="ml-auto text-xs text-dark-500 font-mono">{events.length} events</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {events.length === 0 ? (
                <div className="text-center py-12 text-dark-500">
                  <Radar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Waiting for events...</p>
                  <p className="text-xs mt-1">Run a pipeline or simulate a leak to begin</p>
                </div>
              ) : (
                events.map((event, i) => {
                  const Icon = getEventIcon(event);
                  const colorClass = getEventColor(event);
                  return (
                    <motion.div
                      key={event.id || i}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30 hover:bg-dark-800/60 transition-colors"
                    >
                      <div className={`mt-0.5 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {event.data?.message || event.data?.label || event.stage}
                          </span>
                        </div>
                        {event.data?.duration_ms && (
                          <span className="text-xs text-dark-500">{event.data.duration_ms}ms</span>
                        )}
                        {event.data?.total_reach && (
                          <span className="text-xs text-amber-400 ml-2">
                            Reach: {event.data.total_reach.toLocaleString()}
                          </span>
                        )}
                        {event.data?.risk_level && (
                          <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full ${
                            event.data.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                            event.data.risk_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>{event.data.risk_level}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-dark-600 font-mono whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            <div ref={eventsEndRef} />
          </div>
        </motion.div>

        {/* Pipeline Stages Visualization */}
        <motion.div variants={item} className="card-elevated p-6">
          <h3 className="text-lg font-bold text-white mb-4">Pipeline Stages</h3>

          {pipelineResult ? (
            <div className="space-y-2">
              {pipelineResult.stages.map((stage, i) => {
                const Icon = stageIcons[stage.stage] || Activity;
                const colors = stageColors[stage.stage] || 'from-dark-500 to-dark-600';
                return (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{stage.label}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-aegis-400">{stage.duration_ms}ms</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </motion.div>
                );
              })}

              {/* Summary */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-aegis-600/10 to-accent-600/10 border border-aegis-500/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{pipelineResult.total_duration_ms}ms</p>
                    <p className="text-xs text-dark-400">Total Time</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{pipelineResult.stages.length}</p>
                    <p className="text-xs text-dark-400">Stages</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{pipelineResult.matches?.length || 0}</p>
                    <p className="text-xs text-dark-400">Matches</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-dark-500">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No pipeline results yet</p>
              <p className="text-sm mt-1">Run a detection pipeline to see stage-by-stage analysis</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Leak Simulation Results */}
      <AnimatePresence>
        {leakSimulation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-elevated p-6 border-red-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-400" />
              Leak Simulation Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-3xl font-bold text-red-400">{leakSimulation.platforms_affected}</p>
                <p className="text-xs text-dark-400 mt-1">Platforms Affected</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-3xl font-bold text-amber-400">{leakSimulation.total_reach?.toLocaleString()}</p>
                <p className="text-xs text-dark-400 mt-1">Total Reach</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-dark-400 mt-1">Source Identified</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-dark-400 mt-1">Enforcement Active</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
