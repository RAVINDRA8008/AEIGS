import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Clock,
  Banknote,
  CircleDollarSign,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import { getRevenueDashboard } from '../services/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#06b6d4', '#ec4899'];

const formatCurrency = (val) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

const formatViews = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
};

export default function RevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getRevenueDashboard();
      setData(result);
    } catch (err) {
      console.error('Failed to load revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div><div className="skeleton h-9 w-60 mb-2" /><div className="skeleton h-5 w-80" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80" /><div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  const platformData = data?.platform_breakdown
    ? Object.entries(data.platform_breakdown).map(([name, info]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '…' : name,
        revenue_lost: info.revenue_lost,
        violations: info.violations,
        views: info.estimated_views,
      })).sort((a, b) => b.revenue_lost - a.revenue_lost)
    : [];

  const projectionData = data?.projections
    ? [
        { period: 'Current', value: data.total_impact || 0 },
        { period: '30 Days', value: data.projections['30_day'] || 0 },
        { period: '60 Days', value: data.projections['60_day'] || 0 },
        { period: '90 Days', value: data.projections['90_day'] || 0 },
      ]
    : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <PageHeader
          icon={DollarSign}
          title="Revenue Impact"
          subtitle="Financial analysis of content piracy across your portfolio"
        />
      </motion.div>

      {/* Hero Banner */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-red-600/20 bg-gradient-to-r from-red-600/10 via-dark-900/80 to-orange-600/10 p-6">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-60 h-60 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-600/20">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400 font-medium">Total Revenue Impact</p>
              <p className="text-4xl font-extrabold text-red-400 tracking-tight">
                {formatCurrency(data?.total_impact || 0)}
              </p>
              <p className="text-sm text-dark-500 mt-1">
                Across {data?.total_violations || 0} violations • {formatViews(data?.total_estimated_views || 0)} estimated views
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-dark-500">90-Day Cost of Inaction</p>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(data?.cost_of_inaction || 0)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="section-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Revenue Lost</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(data?.total_revenue_lost || 0)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-600">From unauthorized views & distribution</p>
        </div>

        <div className="section-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Licensing Impact</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(data?.total_licensing_impact || 0)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-600">Devalued licensing from piracy</p>
        </div>

        <div className="section-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Revenue Protected</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(data?.total_revenue_protected || 0)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-600">Recovered via enforcement actions</p>
        </div>

        <div className="section-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Avg Loss / Violation</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(data?.avg_loss_per_violation || 0)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-600">Per-incident financial impact</p>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Loss Projections */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-400" />
            Loss Projections
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
              <XAxis dataKey="period" stroke="#475569" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Projected Loss']}
                contentStyle={{
                  backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(51,65,85,0.5)',
                  borderRadius: '14px', color: '#f1f5f9', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorLoss)"
                dot={{ fill: '#ef4444', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#0f172a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Breakdown */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Revenue Loss by Platform
          </h2>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} width={120} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue Lost']}
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(51,65,85,0.5)',
                    borderRadius: '14px', color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="revenue_lost" radius={[0, 6, 6, 0]}>
                  {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-dark-500">
              <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No platform data yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Monthly Trend + Top Impacted Assets */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Loss Trend */}
        <div className="lg:col-span-2 section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Monthly Revenue Loss Trend
          </h2>
          {data?.monthly_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  formatter={(value, name) => [name === 'revenue_lost' ? formatCurrency(value) : value, name === 'revenue_lost' ? 'Revenue Lost' : 'Violations']}
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(51,65,85,0.5)',
                    borderRadius: '14px', color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="revenue_lost" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-dark-500">
              <TrendingDown className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No trend data yet — scan some content to build history</p>
            </div>
          )}
        </div>

        {/* Top Impacted Assets */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Most Impacted Assets
          </h2>
          {data?.top_impacted_assets?.length > 0 ? (
            <div className="space-y-3">
              {data.top_impacted_assets.map((asset, idx) => (
                <motion.div
                  key={asset.asset_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/30 hover:bg-dark-800/60 transition-all border border-transparent hover:border-dark-700/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-red-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{asset.asset_name}</p>
                    <p className="text-xs text-dark-500">{asset.violations} violations • {formatViews(asset.estimated_views)} views</p>
                  </div>
                  <span className="text-sm font-bold text-red-400">{formatCurrency(asset.revenue_lost)}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-dark-500">
              <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No asset impact data yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
