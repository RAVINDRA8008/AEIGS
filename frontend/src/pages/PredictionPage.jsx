import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  AlertTriangle,
  Shield,
  TrendingUp,
  Target,
  Eye,
  Activity,
  Zap,
  Users,
  BarChart3,
  ArrowUpRight,
  Fingerprint,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  getLeakPredictionDashboard,
  simulateLeakPrediction,
  getAssets,
} from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const riskColors = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', bar: 'from-red-500 to-red-600' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', bar: 'from-orange-500 to-orange-600' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', bar: 'from-yellow-500 to-yellow-600' },
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-600' },
};

export default function PredictionPage() {
  const [dashboard, setDashboard] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simName, setSimName] = useState('');

  useEffect(() => {
    setLoading(true);
    getLeakPredictionDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSimulate = async () => {
    if (!simName.trim()) {
      toast.error('Enter an asset name');
      return;
    }
    setSimulating(true);
    try {
      const result = await simulateLeakPrediction(simName);
      setSimulation(result);
      toast.success('Leak simulation generated');
    } catch (err) {
      toast.error('Simulation failed');
    }
    setSimulating(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Leak Prediction"
        subtitle="Preventive intelligence — predict leaks before they happen"
        icon={<Brain className="w-6 h-6 text-violet-400" />}
      />

      {/* Stats */}
      {dashboard && (
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Assets Analyzed', value: dashboard.total_assets_analyzed, icon: Eye, color: 'from-blue-500 to-blue-600' },
            { label: 'Critical Risk', value: dashboard.critical_risk_count, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
            { label: 'High Risk', value: dashboard.high_risk_count, icon: TrendingUp, color: 'from-orange-500 to-orange-600' },
            { label: 'Avg Probability', value: `${dashboard.average_leak_probability}%`, icon: BarChart3, color: 'from-violet-500 to-violet-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-elevated p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-dark-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Leak Simulation */}
      <motion.div variants={item} className="card-elevated p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-400" />
          Leak Scenario Simulator
        </h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <input
              type="text"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="Enter asset name to simulate a leak scenario..."
              className="w-full bg-dark-800/60 border border-dark-600/50 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:border-red-500/50 transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSimulate}
            disabled={simulating}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {simulating ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Simulate
          </motion.button>
        </div>
      </motion.div>

      {/* Simulation Results */}
      <AnimatePresence>
        {simulation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-elevated p-6 border-red-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4">Simulation: {simulation.asset_name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Origin */}
              <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-white">Leak Origin</span>
                </div>
                <p className="text-sm text-dark-300">Platform: <span className="text-white font-medium">{simulation.leak_origin?.platform}</span></p>
                <p className="text-sm text-dark-300 mt-1">Source: <span className="text-amber-400 font-medium">{simulation.leak_origin?.suspected_source}</span></p>
                <p className="text-sm text-dark-300 mt-1">Confidence: <span className="text-emerald-400 font-medium">{((simulation.leak_origin?.confidence || 0) * 100).toFixed(0)}%</span></p>
              </div>

              {/* Impact */}
              <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-white">Impact</span>
                </div>
                <p className="text-sm text-dark-300">Platforms: <span className="text-white font-medium">{simulation.total_platforms_affected}</span></p>
                <p className="text-sm text-dark-300 mt-1">Total Reach: <span className="text-white font-medium">{simulation.total_reach?.toLocaleString()}</span></p>
                <p className="text-sm text-dark-300 mt-1">Revenue at Risk: <span className="text-red-400 font-medium">${simulation.revenue_at_risk?.toLocaleString()}</span></p>
                <p className="text-sm text-dark-300 mt-1">Time to Viral: <span className="text-white">{simulation.time_to_viral}</span></p>
              </div>

              {/* Top Amplifier */}
              <div className="p-5 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUpRight className="w-5 h-5 text-violet-400" />
                  <span className="font-semibold text-white">Top Amplifier</span>
                </div>
                <p className="text-sm text-dark-300">Platform: <span className="text-white font-medium">{simulation.top_amplifier?.platform}</span></p>
                <p className="text-sm text-dark-300 mt-1">Amplification: <span className="text-violet-400 font-bold">{simulation.top_amplifier?.amplification_factor}x</span></p>
              </div>
            </div>

            {/* Timeline */}
            {simulation.propagation_timeline?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-dark-300 mb-3">Propagation Timeline</h4>
                <div className="space-y-2">
                  {simulation.propagation_timeline.map((event, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/40">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-sm text-white font-medium w-24">{event.platform}</span>
                      <span className="text-xs text-dark-500 flex-1">{event.event_type}</span>
                      <span className="text-xs text-dark-400">Reach: {event.reach?.toLocaleString()}</span>
                      <span className="text-xs text-dark-500 font-mono">{event.velocity?.toLocaleString()}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Risk Assets */}
      {dashboard?.top_risks?.length > 0 && (
        <motion.div variants={item} className="card-elevated p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-aegis-400" />
            Asset Risk Rankings
          </h3>
          <div className="space-y-3">
            {dashboard.top_risks.map((asset, i) => {
              const rc = riskColors[asset.risk_level] || riskColors.medium;
              return (
                <motion.div
                  key={asset.asset_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${rc.bg} border ${rc.border}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center">
                    <span className="text-sm font-bold text-dark-300">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{asset.asset_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden max-w-[200px]">
                        <div
                          className={`h-full bg-gradient-to-r ${rc.bar} rounded-full`}
                          style={{ width: `${asset.leak_probability}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${rc.text}`}>{asset.leak_probability}%</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${rc.bg} ${rc.text} font-medium`}>
                    {asset.risk_level}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="text-center py-12">
          <Activity className="w-8 h-8 animate-spin text-aegis-400 mx-auto mb-2" />
          <p className="text-dark-400">Loading prediction intelligence...</p>
        </div>
      )}
    </motion.div>
  );
}
