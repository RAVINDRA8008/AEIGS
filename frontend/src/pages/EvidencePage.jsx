import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Link2,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
  FileCheck,
  Activity,
  Lock,
  Eye,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getEvidenceChain, verifyEvidenceChain, getEvidenceStats } from '../services/api';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const eventColors = {
  chain_initialized: 'text-blue-400',
  asset_registered: 'text-emerald-400',
  watermark_embedded: 'text-violet-400',
  scan_completed: 'text-cyan-400',
  match_detected: 'text-red-400',
  enforcement_sent: 'text-amber-400',
};

export default function EvidencePage() {
  const [chain, setChain] = useState(null);
  const [stats, setStats] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    Promise.all([
      getEvidenceChain(50, 0).catch(() => null),
      getEvidenceStats().catch(() => null),
    ]).then(([chainData, statsData]) => {
      setChain(chainData);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyEvidenceChain();
      setVerification(result);
      if (result.valid) {
        toast.success(`Chain verified — ${result.blocks_verified} blocks intact`);
      } else {
        toast.error('Chain integrity compromised!');
      }
    } catch (err) {
      toast.error('Verification failed');
    }
    setVerifying(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Evidence Chain"
        subtitle="Tamper-proof hash chain for court-ready evidence"
        icon={<Link2 className="w-6 h-6 text-emerald-400" />}
      />

      {/* Stats + Verify */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-elevated p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto mb-3 flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.total_blocks || 0}</p>
          <p className="text-xs text-dark-400">Total Blocks</p>
        </div>
        <div className="card-elevated p-5 text-center">
          <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${
            stats?.chain_valid !== false ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            {stats?.chain_valid !== false ? <CheckCircle2 className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
          </div>
          <p className="text-lg font-bold text-white">{stats?.chain_valid !== false ? 'Verified' : 'Broken'}</p>
          <p className="text-xs text-dark-400">Chain Integrity</p>
        </div>
        <div className="card-elevated p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-mono text-white truncate">{stats?.genesis_timestamp?.split('T')[0] || '-'}</p>
          <p className="text-xs text-dark-400 mt-1">Genesis Block</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleVerify}
          disabled={verifying}
          className="card-elevated p-5 text-center cursor-pointer hover:border-emerald-500/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            {verifying ? <Activity className="w-5 h-5 text-white animate-spin" /> : <FileCheck className="w-5 h-5 text-white" />}
          </div>
          <p className="text-sm font-bold text-white">Verify Chain</p>
          <p className="text-xs text-dark-400">Run integrity check</p>
        </motion.button>
      </motion.div>

      {/* Verification Result */}
      {verification && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card-elevated p-6 ${verification.valid ? 'border-emerald-500/20' : 'border-red-500/20'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            {verification.valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <h3 className="text-lg font-bold text-white">
              {verification.valid ? 'Chain Integrity Verified' : 'Tampering Detected!'}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-dark-500">Blocks Verified:</span>
              <span className="text-white ml-2 font-medium">{verification.blocks_verified}</span>
            </div>
            <div>
              <span className="text-dark-500">Algorithm:</span>
              <span className="text-white ml-2 font-mono">SHA-256</span>
            </div>
            <div>
              <span className="text-dark-500">Chain Hash:</span>
              <span className="text-dark-400 ml-2 font-mono text-xs">{verification.chain_hash?.slice(0, 16)}...</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Latest Hash */}
      {chain?.latest_hash && (
        <motion.div variants={item} className="card-elevated p-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-dark-500" />
            <span className="text-xs text-dark-500">Latest Chain Hash:</span>
            <code className="text-xs text-aegis-400 font-mono bg-dark-800/60 px-3 py-1 rounded-lg">
              {chain.latest_hash}
            </code>
          </div>
        </motion.div>
      )}

      {/* Evidence Records */}
      <motion.div variants={item} className="card-elevated p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-aegis-400" />
          Evidence Records
        </h3>

        {chain?.records?.length > 0 ? (
          <div className="space-y-2">
            {[...chain.records].reverse().map((block, i) => (
              <motion.div
                key={block.evidence_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30 hover:bg-dark-800/60 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-mono text-dark-400">#{block.index}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${eventColors[block.event_type] || 'text-white'}`}>
                    {block.event_type?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-dark-500 truncate">
                    Hash: {block.hash?.slice(0, 24)}...
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-dark-400">{new Date(block.timestamp).toLocaleString()}</p>
                  <p className="text-[10px] text-dark-600 font-mono">← {block.previous_hash?.slice(0, 12)}...</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-dark-500">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No evidence records yet</p>
            <p className="text-xs mt-1">Records are created automatically as actions occur</p>
          </div>
        )}
      </motion.div>

      {loading && (
        <div className="text-center py-12">
          <Activity className="w-8 h-8 animate-spin text-aegis-400 mx-auto mb-2" />
          <p className="text-dark-400">Loading evidence chain...</p>
        </div>
      )}
    </motion.div>
  );
}
