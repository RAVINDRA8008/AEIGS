import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { getDesignAgent, getDesignAgentsCount } from '../design/agentThemes';

export default function Layout({ children }) {
  const mainRef = useRef(null);
  const location = useLocation();
  const activeAgent = useMemo(() => getDesignAgent(location.pathname), [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--agent-primary', activeAgent.primary);
    root.style.setProperty('--agent-secondary', activeAgent.secondary);
    root.style.setProperty('--agent-accent', activeAgent.accent);
    root.style.setProperty('--agent-aura', activeAgent.aura);
  }, [activeAgent]);

  const handleMouseMove = useCallback((e) => {
    const main = mainRef.current;
    if (!main) return;
    const rect = main.getBoundingClientRect();
    main.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    main.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <Sidebar />
      <main
        ref={mainRef}
        onMouseMove={handleMouseMove}
        className="flex-1 overflow-y-auto relative bg-noise"
      >
        {/* Layered background effects */}
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-25" />
        <div className="fixed inset-0 bg-radial-glow pointer-events-none opacity-80 transition-opacity duration-300" />
        <div className="fixed inset-x-0 top-0 h-[560px] pointer-events-none" style={{ background: 'radial-gradient(1200px 420px at 64% 0%, var(--agent-aura), transparent 70%)' }} />
        <div className="fixed inset-x-0 bottom-0 h-[420px] pointer-events-none opacity-70" style={{ background: 'radial-gradient(900px 280px at 10% 100%, color-mix(in srgb, var(--agent-secondary) 16%, transparent), transparent 75%)' }} />

        <div className="fixed right-8 top-6 z-20 hidden xl:flex items-center gap-2 rounded-full border border-dark-700/70 bg-dark-900/70 px-3 py-1.5 backdrop-blur-xl">
          <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--agent-primary)' }} />
          <span className="text-[10px] uppercase tracking-[0.16em] text-dark-400">Design agent:</span>
          <span className="text-xs font-semibold text-dark-200">{activeAgent.id}</span>
          <span className="text-[10px] text-dark-500">{getDesignAgentsCount()} active</span>
        </div>

        {/* Page content with transition */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="p-6 lg:p-8 min-h-screen"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
