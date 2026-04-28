import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart,
  Download,
  Shield,
  AlertTriangle,
  FolderOpen,
  ScanSearch,
  TrendingUp,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import { getReportSummary, exportViolations, exportAssets } from '../services/api';
import PageHeader from '../components/PageHeader';
import AnimatedCounter from '../components/AnimatedCounter';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#f97316'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    loadSummary();
  }, [days]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getReportSummary(days);
      setSummary(data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportViolations = async () => {
    setExporting('violations');
    try {
      const response = await exportViolations('csv', days);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegis-violations-${days}d.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Violations exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleExportAssets = async () => {
    setExporting('assets');
    try {
      const response = await exportAssets();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aegis-assets.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Assets exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-9 w-48 mb-2" />
        <div className="skeleton h-5 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  const overviewStats = [
    {
      label: 'Protected Assets',
      value: summary?.total_assets || 0,
      icon: FolderOpen,
      color: 'text-aegis-400',
      bg: 'bg-aegis-600/15',
    },
    {
      label: 'Violations Detected',
      value: summary?.total_violations || 0,
      icon: AlertTriangle,
      color: 'text-danger-400',
      bg: 'bg-danger-500/15',
    },
    {
      label: 'Scans Performed',
      value: summary?.total_scans || 0,
      icon: ScanSearch,
      color: 'text-accent-400',
      bg: 'bg-accent-500/15',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          icon={FileBarChart}
          title="Reports & Analytics"
          subtitle="Comprehensive protection insights and data exports"
        >
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                  ${days === d
                    ? 'bg-aegis-600/15 text-aegis-400 border-aegis-600/25 shadow-sm shadow-aegis-600/10'
                    : 'bg-dark-900/50 text-dark-500 border-dark-700/30 hover:border-dark-600 hover:text-dark-300'}`}>
                {d}d
              </button>
            ))}
          </div>
        </PageHeader>
      </motion.div>

      {/* Overview Stats */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="section-card flex items-center gap-4 card-hover">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ring-1 ring-white/5`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <AnimatedCounter value={stat.value} className="text-2xl font-extrabold text-white tabular-nums" />
              <p className="text-sm text-dark-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by Day */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-aegis-400" />
            Detection Trend
          </h2>
          {summary?.violations_by_day?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary.violations_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={11}
                  tickFormatter={(v) => v?.slice(5) || v} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '14px', color: '#f1f5f9',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                }} />
                <Bar dataKey="count" fill="#3381ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-dark-500">
              <p className="text-sm">No data for this period</p>
            </div>
          )}
        </div>

        {/* Violations by Type */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-aegis-400" />
            Violation Breakdown
          </h2>
          {summary?.violations_by_type?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={summary.violations_by_type}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="type"
                    animationBegin={200}
                    animationDuration={800}
                  >
                    {summary.violations_by_type.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: '14px', color: '#f1f5f9',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(12px)',
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {summary.violations_by_type.map((item, idx) => (
                  <div key={item.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-dark-300 capitalize">{item.type}</span>
                    </div>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-dark-500">
              <p className="text-sm">No violations to analyze</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status Breakdown + Exports */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4">By Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: summary?.pending_violations || 0, cls: 'badge-warning', bar: 'bg-warning-500' },
              { label: 'Confirmed', value: summary?.confirmed_violations || 0, cls: 'badge-danger', bar: 'bg-danger-500' },
              { label: 'Dismissed', value: summary?.dismissed_violations || 0, cls: 'badge-success', bar: 'bg-success-500' },
            ].map(({ label, value, cls, bar }) => {
              const pct = summary?.total_violations > 0 ? (value / summary.total_violations) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className={`badge ${cls} w-24 text-center`}>{label}</span>
                  <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full ${bar} rounded-full`}
                    />
                  </div>
                  <span className="text-sm text-white font-medium w-10 text-right">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Section */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-aegis-400" />
            Export Data
          </h2>
          <div className="space-y-3">
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={handleExportViolations} disabled={exporting === 'violations'}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 hover:border-dark-600 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-danger-500/15 flex items-center justify-center group-hover:bg-danger-500/25 transition-colors">
                {exporting === 'violations' ? (
                  <Loader2 className="w-5 h-5 text-danger-400 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-danger-400" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium">Export Violations</p>
                <p className="text-xs text-dark-500">CSV report of detected violations ({days} days)</p>
              </div>
              <Download className="w-4 h-4 text-dark-500 group-hover:text-dark-300 transition-colors" />
            </motion.button>

            <motion.button whileTap={{ scale: 0.98 }}
              onClick={handleExportAssets} disabled={exporting === 'assets'}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 hover:border-dark-600 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-aegis-600/15 flex items-center justify-center group-hover:bg-aegis-600/25 transition-colors">
                {exporting === 'assets' ? (
                  <Loader2 className="w-5 h-5 text-aegis-400 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-aegis-400" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium">Export Asset Registry</p>
                <p className="text-xs text-dark-500">CSV of all registered assets & fingerprints</p>
              </div>
              <Download className="w-4 h-4 text-dark-500 group-hover:text-dark-300 transition-colors" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
