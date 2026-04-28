import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', glow = false, trend = null, delay = 0 }) {
  const colorMap = {
    blue: {
      bg: 'from-aegis-600/10 via-aegis-700/5 to-transparent',
      border: 'border-aegis-600/15',
      icon: 'bg-gradient-to-br from-aegis-500/20 to-aegis-600/10 text-aegis-400 ring-1 ring-aegis-500/20',
      accent: 'text-aegis-400',
      glow: 'glow-blue',
      bar: 'from-aegis-500 to-aegis-400',
    },
    red: {
      bg: 'from-danger-500/10 via-danger-600/5 to-transparent',
      border: 'border-danger-500/15',
      icon: 'bg-gradient-to-br from-danger-500/20 to-danger-600/10 text-danger-400 ring-1 ring-danger-500/20',
      accent: 'text-danger-400',
      glow: 'glow-red',
      bar: 'from-danger-500 to-danger-400',
    },
    danger: {
      bg: 'from-danger-500/10 via-danger-600/5 to-transparent',
      border: 'border-danger-500/15',
      icon: 'bg-gradient-to-br from-danger-500/20 to-danger-600/10 text-danger-400 ring-1 ring-danger-500/20',
      accent: 'text-danger-400',
      glow: 'glow-red',
      bar: 'from-danger-500 to-danger-400',
    },
    green: {
      bg: 'from-success-500/10 via-success-600/5 to-transparent',
      border: 'border-success-500/15',
      icon: 'bg-gradient-to-br from-success-500/20 to-success-600/10 text-success-400 ring-1 ring-success-500/20',
      accent: 'text-success-400',
      glow: 'glow-green',
      bar: 'from-success-500 to-success-400',
    },
    success: {
      bg: 'from-success-500/10 via-success-600/5 to-transparent',
      border: 'border-success-500/15',
      icon: 'bg-gradient-to-br from-success-500/20 to-success-600/10 text-success-400 ring-1 ring-success-500/20',
      accent: 'text-success-400',
      glow: 'glow-green',
      bar: 'from-success-500 to-success-400',
    },
    yellow: {
      bg: 'from-warning-500/10 via-warning-600/5 to-transparent',
      border: 'border-warning-500/15',
      icon: 'bg-gradient-to-br from-warning-500/20 to-warning-600/10 text-warning-400 ring-1 ring-warning-500/20',
      accent: 'text-warning-400',
      glow: 'glow-blue',
      bar: 'from-warning-500 to-warning-400',
    },
    purple: {
      bg: 'from-accent-500/10 via-accent-600/5 to-transparent',
      border: 'border-accent-500/15',
      icon: 'bg-gradient-to-br from-accent-500/20 to-accent-600/10 text-accent-400 ring-1 ring-accent-500/20',
      accent: 'text-accent-400',
      glow: 'glow-purple',
      bar: 'from-accent-500 to-accent-400',
    },
    accent: {
      bg: 'from-accent-500/10 via-accent-600/5 to-transparent',
      border: 'border-accent-500/15',
      icon: 'bg-gradient-to-br from-accent-500/20 to-accent-600/10 text-accent-400 ring-1 ring-accent-500/20',
      accent: 'text-accent-400',
      glow: 'glow-purple',
      bar: 'from-accent-500 to-accent-400',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, delay }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c.bg} ${c.border} p-5 
        ${glow ? c.glow : ''} card-hover`}
    >
      {/* Ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/[0.01] to-transparent rounded-tr-full pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div className="space-y-1.5">
          <p className="text-[13px] text-dark-400 font-medium tracking-wide">{title}</p>
          <div className="overflow-hidden">
            <AnimatedCounter
              value={value}
              className="stat-value"
              duration={1}
            />
          </div>
          {subtitle && (
            <p className="text-xs text-dark-500 mt-1">{subtitle}</p>
          )}
          {trend !== null && (
            <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${trend >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
              <span className="text-dark-600 font-normal">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${c.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
