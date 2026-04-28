import { isValidElement, createElement } from 'react';
import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle, children, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
            style={{
              background: 'linear-gradient(140deg, color-mix(in srgb, var(--agent-primary) 22%, transparent), color-mix(in srgb, var(--agent-secondary) 16%, transparent))',
              borderColor: 'color-mix(in srgb, var(--agent-primary) 28%, rgba(148,163,184,0.25))',
            }}
          >
            {isValidElement(icon) ? icon : createElement(icon, { className: 'w-6 h-6 text-aegis-400' })}
          </div>
        )}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-dark-500 mb-1 font-semibold">Command Center</p>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  );
}
