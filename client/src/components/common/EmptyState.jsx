import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F1F3ED] border border-[#E5E7E0] flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-[#969A92]" />
      </div>
      <h3 className="text-[#171820] font-semibold text-lg mb-2">{title}</h3>
      <p className="text-[#6B7068] text-sm text-center max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
