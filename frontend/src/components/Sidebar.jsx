import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  ScanSearch,
  AlertTriangle,
  Fingerprint,
  FileBarChart,
  ChevronLeft,
  Menu,
  Zap,
  Dna,
  Scale,
  Network,
  Radio,
  Film,
  Brain,
  Link2,
  DollarSign,
  Radar,
  Globe,
  GitCompare,
  FileText,
  Users,
  HandCoins,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & stats' },
  { to: '/assets', icon: FolderOpen, label: 'Assets', description: 'Manage protected media' },
  { to: '/scan', icon: ScanSearch, label: 'Scan', description: 'Detect violations' },
  { to: '/discovery', icon: Radar, label: 'Discovery', description: 'Hunt pirated content' },
  { to: '/matches', icon: AlertTriangle, label: 'Violations', description: 'Review matches' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue Impact', description: 'Financial analysis' },
  { to: '/realtime', icon: Radio, label: 'Live Monitor', description: 'Real-time pipeline' },
  { to: '/video', icon: Film, label: 'Video Intel', description: 'Scene & clip detection' },
  { to: '/prediction', icon: Brain, label: 'Prediction', description: 'Leak intelligence' },
  { to: '/watermark', icon: Dna, label: 'Digital DNA', description: 'Invisible watermarks' },
  { to: '/propagation', icon: Network, label: 'Propagation', description: 'Content spread' },
  { to: '/comparison', icon: GitCompare, label: 'Comparison', description: 'Forensic analysis' },
  { to: '/identity', icon: Users, label: 'Identity Graph', description: 'Offender networks' },
  { to: '/geo', icon: Globe, label: 'Global Map', description: 'Piracy heatmap' },
  { to: '/enforcement', icon: Scale, label: 'Enforcement', description: 'DMCA & takedowns' },
  { to: '/dmca', icon: FileText, label: 'DMCA Generator', description: 'Takedown notices' },
  { to: '/licensing', icon: HandCoins, label: 'Revenue Recovery', description: 'License vs takedown' },
  { to: '/evidence', icon: Link2, label: 'Evidence', description: 'Tamper-proof chain' },
  { to: '/compliance', icon: ShieldCheck, label: 'Compliance', description: 'Audit & GDPR' },
  { to: '/reports', icon: FileBarChart, label: 'Reports', description: 'Analytics & exports' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="bg-dark-900/88 border-r border-dark-700/40 flex flex-col backdrop-blur-2xl relative overflow-hidden select-none"
    >
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-aegis-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-32 h-32 bg-accent-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="p-4 border-b border-dark-700/30 relative">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-gradient-to-br from-aegis-500 to-aegis-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-aegis-600/25"
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <h1 className="text-xl font-extrabold gradient-text tracking-tight leading-none">AEGIS</h1>
                <p className="text-[10px] text-dark-500 tracking-[0.2em] uppercase font-semibold mt-0.5">
                  Digital Shield
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 right-3 p-1.5 rounded-lg text-dark-600 hover:text-dark-300 hover:bg-dark-800/60 transition-all z-10"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </motion.div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 relative">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-dark-600 uppercase tracking-[0.15em] font-semibold px-3 mb-3"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `tooltip-container group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
              ${collapsed ? 'justify-center' : ''}
              ${
                isActive
                  ? 'text-white bg-dark-800/95 ring-1 ring-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.35)]'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/60'
              }`
            }
            end={item.to === '/'}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #3381ff, #a855f7)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-dark-500 group-hover:text-dark-200'
                  }`} />
                </motion.div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="min-w-0"
                    >
                      <span className="block truncate">{item.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <span className="tooltip">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="p-3 border-t border-dark-700/30 relative">
        {collapsed ? (
          <div className="flex justify-center py-2">
            <div className="status-dot bg-success-500 animate-pulse" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-3 bg-dark-800/30 rounded-xl border border-dark-700/20"
          >
            <div className="flex items-center gap-2.5">
              <div className="status-dot bg-success-500 animate-pulse-slow" />
              <span className="text-xs text-dark-400 font-medium">System Active</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5">
              <Zap className="w-3 h-3 text-aegis-500" />
              <span className="text-[10px] text-dark-500 font-medium">
                Powered by Google AI
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}
