import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, FileCheck, Lock, Database, CheckCircle,
  AlertTriangle, Clock, Eye, Award, Server, KeyRound, ScrollText
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function CompliancePage() {
  const [compliance, setCompliance] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [governance, setGovernance] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compRes, auditRes, govRes, intRes] = await Promise.all([
        api.getComplianceStatus(),
        api.getAuditLog(20),
        api.getDataGovernance(),
        api.verifyAuditIntegrity(),
      ]);
      setCompliance(compRes);
      setAuditLog(auditRes);
      setGovernance(govRes);
      setIntegrity(intRes);
    } catch (err) {
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const frameworkColors = {
    compliant: 'text-green-400 bg-green-500/10 border-green-500/20',
    in_progress: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    non_compliant: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const severityColors = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Audit"
        subtitle="Forensic-grade audit logs • SOC2-ready • GDPR compliant"
        icon={<ShieldCheck className="w-6 h-6 text-aegis-400" />}
      />

      {compliance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Compliance Score" value={`${compliance.overall_score}%`} icon={ShieldCheck} color="green" />
          <StatsCard title="Controls Met" value={`${compliance.controls_met}/${compliance.total_controls}`} icon={CheckCircle} color="blue" />
          <StatsCard title="Frameworks" value={compliance.frameworks.length} icon={Award} color="purple" />
          <StatsCard
            title="Chain Integrity"
            value={integrity?.status === 'verified' ? 'Verified' : 'Warning'}
            icon={Lock}
            color={integrity?.status === 'verified' ? 'green' : 'yellow'}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'overview', label: 'Compliance', icon: ShieldCheck },
          { id: 'audit', label: 'Audit Log', icon: ScrollText },
          { id: 'governance', label: 'Data Governance', icon: Database },
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

      {tab === 'overview' && compliance && (
        <div className="space-y-6">
          {/* Compliance Frameworks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compliance.frameworks.map((fw, i) => (
              <motion.div
                key={fw.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">{fw.id}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${frameworkColors[fw.status]}`}>
                    {fw.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-dark-400 mb-3">{fw.name}</p>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-dark-500">Controls</span>
                    <span className="text-xs text-dark-400">{fw.controls_met}/{fw.controls_total}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(fw.controls_met / fw.controls_total) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full rounded-full ${
                        fw.status === 'compliant' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-dark-500 mt-2">{fw.description}</p>
                <p className="text-[10px] text-dark-600 mt-2">Last audit: {fw.last_audit}</p>
              </motion.div>
            ))}
          </div>

          {/* Security Architecture */}
          {compliance.data_handling && (
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-aegis-400" />
                Security Architecture
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(compliance.data_handling).map(([key, value]) => (
                  <div key={key} className="bg-dark-900/40 rounded-lg p-3">
                    <p className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-white font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {compliance.certifications && (
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-aegis-400" />
                Active Certifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {compliance.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 bg-dark-900/40 rounded-lg p-3 border border-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">{cert.name}</p>
                      <p className="text-[10px] text-dark-500">Issued: {cert.issued} • Expires: {cert.expires}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chain Integrity Verification */}
          {integrity && (
            <div className={`border rounded-xl p-5 ${
              integrity.status === 'verified' ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Lock className={`w-5 h-5 ${integrity.status === 'verified' ? 'text-green-400' : 'text-yellow-400'}`} />
                <h3 className="text-white font-semibold">Audit Chain Integrity</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  integrity.status === 'verified' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {integrity.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-dark-500 uppercase">Total Entries</p>
                  <p className="text-lg font-bold text-white">{integrity.total_entries?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-500 uppercase">Verified</p>
                  <p className="text-lg font-bold text-green-400">{integrity.verified_entries?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-500 uppercase">Method</p>
                  <p className="text-xs text-dark-300">{integrity.verification_method}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-500 uppercase">Storage</p>
                  <p className="text-xs text-dark-300">{integrity.storage_backend}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-dark-500 font-mono break-all">Root Hash: {integrity.root_hash}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && auditLog && (
        <div className="space-y-4">
          <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-dark-700/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-aegis-400" />
                Forensic Audit Log
              </h3>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">Tamper-proof • SHA-256</span>
              </div>
            </div>
            <div className="divide-y divide-dark-700/20">
              {auditLog.entries?.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-5 py-3 hover:bg-dark-800/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${severityColors[entry.severity]}`}>
                      {entry.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                       entry.severity === 'warning' ? <Eye className="w-4 h-4" /> :
                       <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-aegis-400">{entry.action}</span>
                        <span className="text-[10px] text-dark-600">{entry.category}</span>
                      </div>
                      <p className="text-sm text-dark-300 mt-0.5">{entry.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] text-dark-500">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="text-[10px] text-dark-600">User: {entry.user}</span>
                        <span className="text-[10px] text-dark-600">IP: {entry.source_ip}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {entry.tamper_proof && <Lock className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                  <div className="mt-1 ml-7">
                    <p className="text-[9px] text-dark-600 font-mono truncate">Hash: {entry.integrity_hash}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'governance' && governance && (
        <div className="space-y-6">
          {/* Data Categories */}
          <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-dark-300 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-aegis-400" />
              Data Categories & Retention
            </h3>
            <div className="space-y-3">
              {governance.data_categories?.map((cat, i) => (
                <div key={i} className="flex items-center justify-between bg-dark-900/40 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Server className="w-4 h-4 text-dark-500" />
                    <div>
                      <p className="text-sm text-white font-medium">{cat.category}</p>
                      <p className="text-[10px] text-dark-500">{cat.records.toLocaleString()} records • Retention: {cat.retention}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cat.pii && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/10 text-yellow-400 font-medium">PII</span>
                    )}
                    {cat.encrypted && (
                      <span className="flex items-center gap-1 text-[10px] text-green-400">
                        <Lock className="w-3 h-3" /> Encrypted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GDPR Controls */}
          {governance.gdpr_controls && (
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 mb-4 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-aegis-400" />
                GDPR Privacy Controls
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(governance.gdpr_controls).filter(([_, v]) => typeof v === 'boolean').map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-dark-900/40 rounded-lg px-3 py-2">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${value ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="text-xs text-dark-300">{key.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-dark-400">
                <span>DPO Contact: {governance.gdpr_controls.dpo_contact}</span>
              </div>
            </div>
          )}

          {/* DSAR stats */}
          {governance.recent_dsar && (
            <div className="bg-dark-800/40 border border-dark-700/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 mb-4">Data Subject Access Requests (DSAR)</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{governance.recent_dsar.total_requests}</p>
                  <p className="text-xs text-dark-500 mt-1">Total Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{governance.recent_dsar.completed}</p>
                  <p className="text-xs text-dark-500 mt-1">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{governance.recent_dsar.avg_response_days}d</p>
                  <p className="text-xs text-dark-500 mt-1">Avg Response</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{governance.recent_dsar.compliance_rate}</p>
                  <p className="text-xs text-dark-500 mt-1">Compliance Rate</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
