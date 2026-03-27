import { motion } from 'framer-motion';
import { HiOutlineFolder, HiOutlineClipboardList, HiOutlineTrendingUp } from 'react-icons/hi';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-20 h-20 rounded-2xl bg-dark-800/60 border border-dark-600/30 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-dark-400" />
      </div>
      <h3 className="text-white font-semibold text-xl mb-2">{title}</h3>
      <p className="text-dark-400 text-sm text-center max-w-sm mb-6">{description}</p>
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
