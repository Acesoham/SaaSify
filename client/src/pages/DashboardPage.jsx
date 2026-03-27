import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineTrendingUp, HiOutlineExclamation } from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

function StatCard({ icon: Icon, iconBg, label, value, change, changeColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-300 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {change && <p className={`text-xs mt-2 ${changeColor}`}>{change}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setStats(data.data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const s = stats?.stats || {};
  const completionTrend = stats?.completionTrend || [];
  const teamProductivity = stats?.teamProductivity || [];

  // Format trend data for chart
  const chartData = completionTrend.map((d) => ({
    day: new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' }),
    tasks: d.total,
    completed: d.completed,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-300 mt-1">Welcome back, {user?.name || 'User'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineCheckCircle} iconBg="bg-primary-500" label="Total Tasks" value={s.totalTasks ?? 0} change={s.totalTasks > 0 ? 'All time' : 'Create your first task'} changeColor="text-dark-400" delay={0} />
        <StatCard icon={HiOutlineClock} iconBg="bg-accent-cyan" label="In Progress" value={s.inProgress ?? 0} delay={0.05} />
        <StatCard icon={HiOutlineTrendingUp} iconBg="bg-accent-green" label="Completed" value={s.completed ?? 0} delay={0.1} />
        <StatCard icon={HiOutlineExclamation} iconBg="bg-accent-red" label="Urgent" value={s.urgent ?? 0} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-white font-semibold text-lg">Task Completion</h3>
          <p className="text-dark-400 text-sm mb-4">Last 7 days</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                <XAxis dataKey="day" stroke="#7575a3" fontSize={12} />
                <YAxis stroke="#7575a3" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#171730', border: '1px solid #2d2d5e', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="tasks" stroke="#6C5CE7" fill="url(#taskGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-dark-400 text-sm">
              No task data yet. Create tasks to see trends.
            </div>
          )}
        </motion.div>

        {/* Team Productivity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-white font-semibold text-lg">Team Productivity</h3>
          <p className="text-dark-400 text-sm mb-4">Tasks completed by user</p>
          {teamProductivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teamProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                <XAxis dataKey="name" stroke="#7575a3" fontSize={12} />
                <YAxis stroke="#7575a3" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#171730', border: '1px solid #2d2d5e', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="completedTasks" fill="#8c75ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-dark-400 text-sm">
              No completions yet. Finish tasks to see productivity.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
