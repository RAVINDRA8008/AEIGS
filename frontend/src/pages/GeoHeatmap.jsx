import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Eye,
  Activity,
  Zap,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  Filter,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getGeoHeatmap, getGeoRegion, getGeoContinents, getGeoTrending } from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const riskColor = {
  critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500', glow: 'shadow-red-500/20' },
  high: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  medium: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500', glow: 'shadow-yellow-500/20' },
  low: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
};

const trendIcon = (t) => t === 'rising' ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> : t === 'declining' ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : <Minus className="w-3.5 h-3.5 text-dark-400" />;

export default function GeoHeatmap() {
  const [heatmap, setHeatmap] = useState(null);
  const [continents, setContinents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionDetail, setRegionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sportFilter, setSportFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [sportFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hm, cont, trend] = await Promise.all([
        getGeoHeatmap(sportFilter || undefined),
        getGeoContinents(),
        getGeoTrending(10),
      ]);
      setHeatmap(hm);
      setContinents(cont);
      setTrending(trend);
    } catch {
      toast.error('Failed to load geo data');
    }
    setLoading(false);
  };

  const handleRegionClick = async (region) => {
    setSelectedRegion(region);
    setDetailLoading(true);
    try {
      const detail = await getGeoRegion(region.id);
      setRegionDetail(detail);
    } catch {
      toast.error('Failed to load region details');
    }
    setDetailLoading(false);
  };

  const sports = ['Football/Soccer', 'Cricket', 'Basketball', 'Tennis', 'Formula 1', 'Boxing', 'MMA/UFC'];

  // World map visualization using positioned dots
  const maxViolations = useMemo(() => {
    if (!heatmap) return 1;
    return Math.max(...heatmap.hotspots.map(h => h.violations), 1);
  }, [heatmap]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Global Piracy Map"
        subtitle="Worldwide piracy hotspots, regional intelligence, and enforcement analytics"
        icon={<Globe className="w-6 h-6 text-cyan-400" />}
      />

      {/* Stats bar */}
      {heatmap && (
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Violations', value: heatmap.total_violations.toLocaleString(), icon: AlertTriangle, color: 'from-red-500 to-red-600' },
            { label: 'Regions Tracked', value: heatmap.total_regions, icon: Globe, color: 'from-cyan-500 to-cyan-600' },
            { label: 'High Risk Zones', value: heatmap.high_risk_regions, icon: Shield, color: 'from-orange-500 to-orange-600' },
            { label: 'Trending Up', value: trending.length, icon: TrendingUp, color: 'from-violet-500 to-violet-600' },
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
      )}

      {/* Sport filter */}
      <motion.div variants={item} className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-dark-400" />
        <button
          onClick={() => setSportFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!sportFilter ? 'bg-aegis-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}
        >
          All Sports
        </button>
        {sports.map(s => (
          <button
            key={s}
            onClick={() => setSportFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sportFilter === s ? 'bg-aegis-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}
          >
            {s}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-aegis-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* World Map Visualization */}
          <motion.div variants={item} className="lg:col-span-2 card-elevated p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Worldwide Piracy Heatmap
            </h3>
            <div className="relative bg-dark-900 rounded-xl overflow-hidden" style={{ height: 420 }}>
              {/* Grid background */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(100,200,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,200,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />

              {/* Map dots */}
              {heatmap?.hotspots.map(spot => {
                const x = ((spot.lng + 180) / 360) * 100;
                const y = ((90 - spot.lat) / 180) * 100;
                const size = 8 + (spot.violations / maxViolations) * 28;
                const rc = riskColor[spot.risk_level] || riskColor.low;

                return (
                  <motion.button
                    key={spot.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: Math.random() * 0.5, type: 'spring' }}
                    onClick={() => handleRegionClick(spot)}
                    className={`absolute rounded-full cursor-pointer transition-all hover:z-20 group ${selectedRegion?.id === spot.id ? 'ring-2 ring-white z-30' : ''}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Glow ring */}
                    <div className={`absolute inset-0 rounded-full ${rc.dot} opacity-30 animate-ping`} style={{ animationDuration: '3s' }} />
                    {/* Core dot */}
                    <div className={`absolute inset-0 rounded-full ${rc.dot} opacity-80 shadow-lg ${rc.glow}`} />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                        <p className="font-bold text-white">{spot.name}</p>
                        <p className={rc.text}>{spot.violations.toLocaleString()} violations</p>
                        <p className="text-dark-400">{spot.primary_sport}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-dark-800/90 border border-dark-600 rounded-lg px-3 py-2 text-xs space-y-1">
                {[
                  { label: 'Critical', color: 'bg-red-500' },
                  { label: 'High', color: 'bg-orange-500' },
                  { label: 'Medium', color: 'bg-yellow-500' },
                  { label: 'Low', color: 'bg-emerald-500' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                    <span className="text-dark-300">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Region Detail / Trending */}
          <motion.div variants={item} className="space-y-6">
            {/* Selected region detail */}
            <AnimatePresence mode="wait">
              {selectedRegion && (
                <motion.div
                  key={selectedRegion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card-elevated p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${riskColor[selectedRegion.risk_level]?.bg}`}>
                      <MapPin className={`w-5 h-5 ${riskColor[selectedRegion.risk_level]?.text}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{selectedRegion.name}</h4>
                      <p className="text-xs text-dark-400">{selectedRegion.continent}</p>
                    </div>
                  </div>

                  {detailLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : regionDetail ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-dark-800/60 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-white">{regionDetail.total_violations_30d.toLocaleString()}</p>
                          <p className="text-[10px] text-dark-400">30d Violations</p>
                        </div>
                        <div className="bg-dark-800/60 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-white">{regionDetail.risk_score}%</p>
                          <p className="text-[10px] text-dark-400">Risk Score</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-dark-400 mb-2">Top Platforms</p>
                        {regionDetail.platform_breakdown?.slice(0, 4).map(p => (
                          <div key={p.platform} className="flex items-center justify-between py-1">
                            <span className="text-xs text-dark-300">{p.platform}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${p.takedown_success * 100}%` }} />
                              </div>
                              <span className="text-xs text-dark-400">{p.violations}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {regionDetail.active_streams?.length > 0 && (
                        <div>
                          <p className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-red-400" /> Live Streams
                          </p>
                          {regionDetail.active_streams.slice(0, 3).map(s => (
                            <div key={s.id} className="flex items-center justify-between py-1">
                              <span className="text-xs text-dark-300">{s.platform} — {s.sport}</span>
                              <span className={`text-xs ${s.status === 'live' ? 'text-red-400' : s.status === 'taken_down' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                {s.status === 'live' ? '● LIVE' : s.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Strategic Intelligence: WHY + WHAT TO DO */}
                      {selectedRegion.risk_explanation && (
                        <div className="mt-3 space-y-2">
                          <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                            <p className="text-[10px] text-red-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Why It Happens
                            </p>
                            <p className="text-xs text-dark-300 leading-relaxed">{selectedRegion.risk_explanation}</p>
                          </div>
                          <div className="bg-aegis-500/5 border border-aegis-500/15 rounded-lg p-3">
                            <p className="text-[10px] text-aegis-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Recommended Action
                            </p>
                            <p className="text-xs text-dark-300 leading-relaxed">{selectedRegion.suggested_action}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trending Hotspots */}
            <div className="card-elevated p-5">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                Rising Hotspots
              </h4>
              <div className="space-y-2">
                {trending.slice(0, 6).map((t, i) => (
                  <motion.button
                    key={t.id}
                    onClick={() => handleRegionClick(t)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-dark-800/40 hover:bg-dark-800/80 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-dark-500">#{i + 1}</span>
                      <span className="text-sm text-white">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">+{t.change_pct}%</span>
                      <ChevronRight className="w-3.5 h-3.5 text-dark-500" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Continent Breakdown */}
          <motion.div variants={item} className="lg:col-span-2 card-elevated p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Continental Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {continents.map((c, i) => {
                const maxViol = Math.max(...continents.map(x => x.violations), 1);
                const pct = (c.violations / maxViol) * 100;
                return (
                  <motion.div
                    key={c.continent}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-dark-800/50 rounded-xl p-4 text-center"
                  >
                    <p className="text-xs text-dark-400 mb-2">{c.continent}</p>
                    <div className="w-full h-20 flex items-end justify-center mb-2">
                      <div
                        className="w-8 rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all"
                        style={{ height: `${Math.max(pct, 10)}%` }}
                      />
                    </div>
                    <p className="text-lg font-bold text-white">{c.violations.toLocaleString()}</p>
                    <p className="text-[10px] text-dark-500">{c.regions} regions • {c.high_risk} high risk</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Top 10 Hotspot Table */}
          <motion.div variants={item} className="lg:col-span-1 card-elevated p-5">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              Top Regions
            </h4>
            <div className="space-y-1.5">
              {heatmap?.hotspots.slice(0, 10).map((h, i) => {
                const rc = riskColor[h.risk_level] || riskColor.low;
                return (
                  <button
                    key={h.id}
                    onClick={() => handleRegionClick(h)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-800/60 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-dark-500 w-4">{i + 1}</span>
                      <div className={`w-2 h-2 rounded-full ${rc.dot}`} />
                      <span className="text-sm text-dark-200 group-hover:text-white transition-colors">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {trendIcon(h.trend)}
                      <span className="text-xs text-dark-400 font-mono">{h.violations.toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
