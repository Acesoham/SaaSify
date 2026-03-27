import { motion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineClock } from 'react-icons/hi';

const deployments = [
  { id: 1, message: 'feat: add new dashboard', env: 'Production', status: 'success', time: '2 min ago', icon: HiOutlineCheckCircle, statusColor: 'bg-accent-green/20 text-accent-green', envColor: 'bg-accent-green/20 text-accent-green', iconColor: 'text-accent-green' },
  { id: 2, message: 'fix: resolve auth bug', env: 'Staging', status: 'success', time: '15 min ago', icon: HiOutlineCheckCircle, statusColor: 'bg-accent-green/20 text-accent-green', envColor: 'bg-accent-blue/20 text-accent-blue', iconColor: 'text-accent-green' },
  { id: 3, message: 'refactor: update API', env: 'Production', status: 'failed', time: '1 hour ago', icon: HiOutlineExclamationCircle, statusColor: 'bg-accent-red/20 text-accent-red', envColor: 'bg-accent-green/20 text-accent-green', iconColor: 'text-accent-red' },
  { id: 4, message: 'chore: update deps', env: 'Development', status: 'in-progress', time: '5 min ago', icon: HiOutlineClock, statusColor: 'bg-accent-blue/20 text-accent-blue', envColor: 'bg-accent-yellow/20 text-accent-yellow', iconColor: 'text-accent-blue' },
];

export default function DevOpsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">DevOps Dashboard</h1>
        <p className="text-dark-300 mt-1">Monitor deployments, health metrics, and system alerts</p>
      </div>

      {/* Recent Deployments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiOutlineLightningBolt className="w-5 h-5 text-accent-yellow" />
          <h2 className="text-white font-semibold text-lg">Recent Deployments</h2>
        </div>

        <div className="space-y-4">
          {deployments.map((deploy, idx) => (
            <motion.div
              key={deploy.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/40 border border-dark-600/20 hover:border-dark-600/40 transition-all"
            >
              <deploy.icon className={`w-8 h-8 ${deploy.iconColor} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${deploy.envColor}`}>{deploy.env}</span>
                  <span className={`badge ${deploy.statusColor}`}>{deploy.status}</span>
                </div>
                <p className="text-white font-mono text-sm">{deploy.message}</p>
                <p className="text-dark-400 text-xs mt-0.5">{deploy.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'API Uptime', value: '99.9%', color: 'text-accent-green' },
          { label: 'Avg Response Time', value: '142ms', color: 'text-accent-blue' },
          { label: 'Error Rate', value: '0.2%', color: 'text-accent-green' },
        ].map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="glass-card p-5 text-center"
          >
            <p className="text-dark-400 text-sm mb-1">{metric.label}</p>
            <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
