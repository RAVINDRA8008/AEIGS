import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HandCoins, TrendingUp, ArrowRightLeft, Users, DollarSign,
  Target, CheckCircle, Clock, XCircle, BarChart3, Zap, FileCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function LicensingPage() {
  const [dashboard, setDashboard] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pipeline');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, metricsRes] = await Promise.all([
        api.getLicensingDashboard(),
        api.getLicensingMetrics(),
      ]);
      setDashboard(dashRes);
      setMetrics(metricsRes);
    } catch (err) {
      toast.error('Failed to load licensing data');
    } finally {
      setLoading(false);
    }
  };

  const evaluateOpp = async (oppId) => {
    try {
      setSelectedOpp(oppId);
      const res = await api.evaluateLicensing(oppId);
      setEvaluation(res);
    } catch (err) {
      toast.error('Failed to evaluate opportunity');
    }
  };

  const statusColors = {
    identified: 'text-blue-400 bg-blue-500/10',
    contacted: 'text-cyan-400 bg-cyan-500/10',
    negotiating: 'text-yellow-400 bg-yellow-500/10',
    converted: 'text-green-400 bg-green-500/10',
    declined: 'text-red-400 bg-red-500/10',
  };

  const statusIcons = {
    identified: Target,
    contacted: Users,
    negotiating: Clock,
    converted: CheckCircle,
    declined: XCircle,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Recovery"
        subtitle="Convert violations into licensing revenue — monetize instead of just blocking"
        icon={<HandCoins className="w-6 h-6 text-aegis-400" />}
      />

      {dashboard?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Pipeline Value" value={`$${(dashboard.summary.total_pipeline_value / 1000).toFixed(0)}K`} icon={DollarSign} color="green" />
          <StatsCard title="Monthly Revenue" value={`$${dashboard.summary.active_monthly_revenue.toLocaleString()}`} icon={TrendingUp} color="blue" />
          <StatsCard title="Conversion Rate" value={`${dashboard.summary.conversion_rate}%`} icon={ArrowRightLeft} color="purple" />
          <StatsCard title="Opportunities" value={dashboard.summary.total_opportunities} icon={Target} color="amber" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'pipeline', label: 'Pipeline', icon: Target },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-aegis-600/20 text-aegis-400 border border-aegis-500/30' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/40'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <div className="space-y-6">
          {/* Pipeline funnel */}
          {dashboard?.pipeline && (
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-aegis-400" />
                Licensing Pipeline
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(dashboard.pipeline).map(([stage, count], i) => {
                  const Icon = statusIcons[stage] || Target;
                  return (
                    <div key={stage} className="text-center">
                      <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${statusColors[stage]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider mt-1">{stage}</p>
                      {i < 4 && (
                        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2">
                          <span className="text-dark-600">→</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opportunity cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboard?.opportunities?.map((opp, i) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-4 hover:border-aegis-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{opp.violator_handle}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[opp.status]}`}>
                        {opp.status}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">{opp.platform} • {opp.channel_type} • {opp.content_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${opp.revenue_potential.toLocaleString()}</p>
                    <p className="text-[10px] text-dark-500">{opp.suggested_tier}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-dark-500">Followers</p>
                    <p className="text-sm font-bold text-white">{(opp.followers / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">Monthly Views</p>
                    <p className="text-sm font-bold text-white">{(opp.monthly_views / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">Conversion Prob.</p>
                    <p className="text-sm font-bold text-aegis-400">{(opp.conversion_probability * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <button
                  onClick={() => evaluateOpp(opp.id)}
                  className="w-full mt-3 py-2 rounded-lg text-xs font-medium bg-aegis-600/10 text-aegis-400 hover:bg-aegis-600/20 transition-colors border border-aegis-500/20"
                >
                  Evaluate: License vs Takedown
                </button>
              </motion.div>
            ))}
          </div>

          {/* Evaluation result */}
          {evaluation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800/40 border border-aegis-500/30 rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-aegis-400" />
                AI Evaluation: {evaluation.recommendation === 'license' ? '✅ License Recommended' : evaluation.recommendation === 'monitor' ? '👀 Monitor' : '⚠️ Takedown'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {Object.entries(evaluation.evaluation).filter(([k]) => k !== 'overall_score').map(([key, val]) => (
                  <div key={key}>
                    <p className="text-[10px] text-dark-500 uppercase">{key.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${val > 70 ? 'bg-green-500' : val > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <span className="text-xs text-dark-400">{val.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-dark-300">{evaluation.suggested_action?.description}</p>
              {evaluation.financial_comparison && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-400 mb-2">Takedown Outcome</p>
                    <p className="text-sm text-dark-400">Revenue: <span className="text-white font-bold">$0</span></p>
                    <p className="text-sm text-dark-400">Legal cost: <span className="text-white">${evaluation.financial_comparison.takedown_outcome.legal_cost}</span></p>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-400 mb-2">Licensing Outcome</p>
                    <p className="text-sm text-dark-400">Monthly: <span className="text-white font-bold">${evaluation.financial_comparison.licensing_outcome.monthly_revenue}</span></p>
                    <p className="text-sm text-dark-400">Annual: <span className="text-white">${evaluation.financial_comparison.licensing_outcome.annual_projection.toLocaleString()}</span></p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {tab === 'analytics' && metrics && (
        <div className="space-y-6">
          <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-dark-300 mb-4">Revenue Recovery: Licensing vs Takedowns</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.monthly_data}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="license_revenue" name="License Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="takedowns" name="Takedowns" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-dark-300 mb-2">AI Insight</h3>
            <p className="text-dark-300 text-sm leading-relaxed">{metrics.insight}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">${metrics.totals.total_license_revenue.toLocaleString()}</p>
              <p className="text-xs text-dark-500 mt-1">Total License Revenue</p>
            </div>
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{metrics.totals.total_licenses}</p>
              <p className="text-xs text-dark-500 mt-1">Licenses Issued</p>
            </div>
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{metrics.totals.total_takedowns}</p>
              <p className="text-xs text-dark-500 mt-1">Total Takedowns</p>
            </div>
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-aegis-400">${metrics.totals.avg_license_value.toLocaleString()}</p>
              <p className="text-xs text-dark-500 mt-1">Avg License Value</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
