import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-20 ${className}`}
    >
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 rounded-3xl bg-dark-800/80 border border-dark-700/50 flex items-center justify-center mx-auto">
          <Icon className="w-9 h-9 text-dark-500" />
        </div>
        <div className="absolute -inset-4 bg-aegis-500/5 rounded-full blur-2xl" />
      </div>
      <h2 className="text-xl font-semibold text-dark-300">{title}</h2>
      {description && <p className="text-dark-500 mt-2 max-w-sm mx-auto">{description}</p>}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action}
          className="btn-primary mt-6 mx-auto"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
