import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineTrendingUp, HiOutlineExclamation } from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

function StatCard({ icon: Icon, iconBg, label, value, change, changeColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-[#E5E7E0] rounded-xl p-5 shadow-[0_1px_3px_rgba(23,24,32,0.06)] hover:shadow-[0_4px_12px_rgba(23,24,32,0.08)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#6B7068] text-sm">{label}</p>
          <p className="text-3xl font-bold text-[#171820] mt-1.5">{value}</p>
          {change && <p className={`text-xs mt-2 ${changeColor}`}>{change}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5" />
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
        <h1 className="text-2xl font-bold text-[#171820]">Dashboard</h1>
        <p className="text-[#6B7068] text-sm mt-1">Welcome back, {user?.name || 'User'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineCheckCircle}
          iconBg="bg-[#EFF9D4]"
          label="Total Tasks"
          value={s.totalTasks ?? 0}
          change={s.totalTasks > 0 ? 'All time' : 'Create your first task'}
          changeColor="text-[#6B7068]"
          delay={0}
        />
        <StatCard
          icon={HiOutlineClock}
          iconBg="bg-[#EFF9D4]"
          label="In Progress"
          value={s.inProgress ?? 0}
          delay={0.05}
        />
        <StatCard
          icon={HiOutlineTrendingUp}
          iconBg="bg-[#287D48]/10"
          label="Completed"
          value={s.completed ?? 0}
          delay={0.1}
        />
        <StatCard
          icon={HiOutlineExclamation}
          iconBg="bg-[#C43D3D]/10"
          label="Urgent"
          value={s.urgent ?? 0}
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 shadow-[0_1px_3px_rgba(23,24,32,0.06)]"
        >
          <h3 className="text-[#171820] font-semibold text-base">Task Completion</h3>
          <p className="text-[#6B7068] text-xs mt-0.5 mb-5">Last 7 days</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C4F13B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#C4F13B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3ED" vertical={false} />
                <XAxis dataKey="day" stroke="#969A92" fontSize={11} axisLine={false} tickLine={false} dy={6} />
                <YAxis stroke="#969A92" fontSize={11} axisLine={false} tickLine={false} dx={-6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7E0',
                    borderRadius: '10px',
                    color: '#171820',
                    boxShadow: '0 4px 12px rgba(23,24,32,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="tasks" stroke="#C4F13B" fill="url(#taskGradient)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[230px] text-[#969A92] text-sm bg-[#F8F9F5] rounded-lg border-2 border-dashed border-[#E5E7E0]">
              No task data yet. Create tasks to see trends.
            </div>
          )}
        </motion.div>

        {/* Team Productivity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 shadow-[0_1px_3px_rgba(23,24,32,0.06)]"
        >
          <h3 className="text-[#171820] font-semibold text-base">Team Productivity</h3>
          <p className="text-[#6B7068] text-xs mt-0.5 mb-5">Tasks completed by user</p>
          {teamProductivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={teamProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3ED" vertical={false} />
                <XAxis dataKey="name" stroke="#969A92" fontSize={11} axisLine={false} tickLine={false} dy={6} />
                <YAxis stroke="#969A92" fontSize={11} axisLine={false} tickLine={false} dx={-6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7E0',
                    borderRadius: '10px',
                    color: '#171820',
                    boxShadow: '0 4px 12px rgba(23,24,32,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="completedTasks" fill="#C4F13B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[230px] text-[#969A92] text-sm bg-[#F8F9F5] rounded-lg border-2 border-dashed border-[#E5E7E0]">
              No completions yet. Finish tasks to see productivity.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
