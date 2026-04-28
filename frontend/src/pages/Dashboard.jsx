import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  FolderOpen,
  ScanSearch,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Clock,
  Upload,
  Eye,
  Zap,
  LayoutDashboard,
  ArrowUpRight,
  Dna,
  Scale,
  Network,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import {
  getDashboardStats, getActivity, getRiskDashboard, getEnforcementStats, getPropagationOverview, getRevenueSummary
} from '../services/api';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#22c55e'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const activityIcons = {
  scan: ScanSearch,
  match: AlertTriangle,
  asset: Upload,
  status: Eye,
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [enforcementData, setEnforcementData] = useState(null);
  const [propagationData, setPropagationData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadStats(), loadActivity(), loadIntelligence()]).finally(() => setLoading(false));
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadActivity = async () => {
    try {
      const data = await getActivity(15);
      setActivity(data.activities || []);
    } catch { /* */ }
  };

  const loadIntelligence = async () => {
    try {
      const [risk, enforce, prop, rev] = await Promise.allSettled([
        getRiskDashboard(),
        getEnforcementStats(),
        getPropagationOverview(),
        getRevenueSummary(),
      ]);
      if (risk.status === 'fulfilled') setRiskData(risk.value);
      if (enforce.status === 'fulfilled') setEnforcementData(enforce.value);
      if (prop.status === 'fulfilled') setPropagationData(prop.value);
      if (rev.status === 'fulfilled') setRevenueData(rev.value);
    } catch { /* */ }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <div className="skeleton h-9 w-60 mb-2" />
          <div className="skeleton h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-80" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={item}>
        <PageHeader
          icon={LayoutDashboard}
          title="Command Center"
          subtitle="Real-time digital asset protection monitoring"
        />
      </motion.div>

      {/* Hero Stat Banner */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-aegis-600/20 bg-gradient-to-r from-aegis-600/10 via-dark-900/80 to-accent-600/10 p-6">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-60 h-60 bg-aegis-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-aegis-500 to-aegis-700 flex items-center justify-center shadow-lg shadow-aegis-600/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400 font-medium">Protection Score</p>
              <p className="text-4xl font-extrabold gradient-text-hero tracking-tight">
                {stats?.total_assets || 0} Assets Secured
              </p>
              <p className="text-sm text-dark-500 mt-1">
                {stats?.total_scans || 0} scans completed • {stats?.confirmed_violations || 0} violations confirmed
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <a href="/scan" className="btn-primary">
              <ScanSearch className="w-4 h-4" /> New Scan <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Protected Assets"
          value={stats?.total_assets || 0}
          subtitle="Registered & fingerprinted"
          icon={FolderOpen}
          color="blue"
          glow
          delay={0}
        />
        <StatsCard
          title="Total Scans"
          value={stats?.total_scans || 0}
          subtitle="Content verified"
          icon={ScanSearch}
          color="accent"
          delay={0.1}
        />
        <StatsCard
          title="Violations Found"
          value={stats?.total_matches || 0}
          subtitle={`${stats?.pending_violations || 0} pending review`}
          icon={AlertTriangle}
          color="danger"
          glow={stats?.pending_violations > 0}
          delay={0.2}
        />
        <StatsCard
          title="Confirmed"
          value={stats?.confirmed_violations || 0}
          subtitle="Verified violations"
          icon={CheckCircle2}
          color="success"
          delay={0.3}
        />
      </motion.div>

      {/* Intelligence Row */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue Impact */}
        <a href="/revenue" className="section-card p-5 card-hover group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xs text-dark-400">Revenue Impact</div>
              <div className="text-sm font-semibold text-red-400">
                {revenueData?.total_revenue_lost ? `$${(revenueData.total_revenue_lost / 1000).toFixed(1)}K lost` : '$0 tracked'}
              </div>
            </div>
          </div>
          <div className="text-xs text-dark-500">
            {revenueData?.total_revenue_protected ? `$${(revenueData.total_revenue_protected / 1000).toFixed(1)}K protected` : 'Track financial impact'} • <span className="text-orange-400">{revenueData?.cost_of_inaction_90d ? `$${(revenueData.cost_of_inaction_90d / 1000).toFixed(1)}K` : '$0'} at risk (90d)</span>
          </div>
        </a>

        {/* Risk Intelligence */}
        <a href="/matches" className="section-card p-5 card-hover group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-xs text-dark-400">Risk Intelligence</div>
              <div className="text-sm font-semibold">
                {riskData?.by_level?.critical || 0} Critical
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {['critical', 'high', 'medium', 'low'].map((level) => {
              const count = riskData?.by_level?.[level] || 0;
              const colors = {
                critical: 'bg-red-500/20 text-red-400',
                high: 'bg-orange-500/20 text-orange-400',
                medium: 'bg-amber-500/20 text-amber-400',
                low: 'bg-green-500/20 text-green-400',
              };
              return (
                <span key={level} className={`text-xs px-2 py-0.5 rounded ${colors[level]}`}>
                  {count} {level}
                </span>
              );
            })}
          </div>
        </a>

        {/* Enforcement */}
        <a href="/enforcement" className="section-card p-5 card-hover group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-dark-400">Enforcement</div>
              <div className="text-sm font-semibold">
                {enforcementData?.total_actions || 0} Actions
              </div>
            </div>
          </div>
          <div className="text-xs text-dark-500">
            {enforcementData?.compliance_rate || 0}% compliance rate
          </div>
        </a>

        {/* Propagation */}
        <a href="/propagation" className="section-card p-5 card-hover group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-dark-400">Propagation</div>
              <div className="text-sm font-semibold">
                {propagationData?.total_nodes || 0} Nodes
              </div>
            </div>
          </div>
          <div className="text-xs text-dark-500">
            {propagationData?.assets_affected || 0} assets tracked across{' '}
            {Object.keys(propagationData?.platforms || {}).length} platforms
          </div>
        </a>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violations Over Time */}
        <div className="lg:col-span-2 section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-aegis-400" />
            Violations Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.matches_by_day || []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3381ff" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="#3381ff" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#3381ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#475569"
                fontSize={11}
                tickFormatter={(v) => v?.slice(5) || v}
                axisLine={false}
                tickLine={false}
              />
              <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '14px',
                  color: '#f1f5f9',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                  padding: '12px 16px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3381ff"
                strokeWidth={2.5}
                fill="url(#colorCount)"
                dot={{ fill: '#3381ff', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#3381ff', strokeWidth: 2, fill: '#0f172a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Types */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-aegis-400" />
            By Type
          </h2>
          {stats?.matches_by_type?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.matches_by_type}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="type"
                    animationBegin={200}
                    animationDuration={800}
                  >
                    {stats.matches_by_type.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: '14px',
                      color: '#f1f5f9',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(12px)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {stats.matches_by_type.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-dark-300 capitalize">{item.type}</span>
                    </div>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-dark-500">
              <Shield className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No violations yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity Feed + Recent Violations */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Violations */}
        <div className="lg:col-span-2 section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-400" />
            Recent Violations
          </h2>
          {stats?.recent_matches?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_matches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/30 hover:bg-dark-800/60 transition-all group border border-transparent hover:border-dark-700/30"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    match.similarity_score >= 0.9 ? 'bg-danger-500/20' :
                    match.similarity_score >= 0.8 ? 'bg-warning-500/20' : 'bg-aegis-500/20'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      match.similarity_score >= 0.9 ? 'text-danger-400' :
                      match.similarity_score >= 0.8 ? 'text-warning-400' : 'text-aegis-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{match.asset_name}</p>
                    <p className="text-xs text-dark-500">{new Date(match.detected_at).toLocaleString()}</p>
                  </div>
                  <span className={`badge ${
                    match.match_type === 'exact' ? 'badge-danger' :
                    match.match_type === 'near-duplicate' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {match.match_type}
                  </span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      match.similarity_score >= 0.9 ? 'text-danger-400' :
                      match.similarity_score >= 0.8 ? 'text-warning-400' : 'text-aegis-400'
                    }`}>
                      {(match.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className={`badge ${
                    match.status === 'confirmed' ? 'badge-danger' :
                    match.status === 'dismissed' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {match.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-dark-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No violations detected yet</p>
              <p className="text-sm mt-1">Register assets and scan content to get started</p>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-400" />
            Live Activity
          </h2>
          {activity.length > 0 ? (
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {activity.map((act, idx) => {
                const Icon = activityIcons[act.type] || Zap;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-start gap-3 text-sm p-2.5 rounded-xl hover:bg-dark-800/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-dark-800/80 border border-dark-700/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-dark-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-dark-300 truncate">{act.message}</p>
                      <p className="text-[11px] text-dark-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {act.time_ago || 'just now'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-dark-500">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
