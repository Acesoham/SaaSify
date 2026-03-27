import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineTrendingUp, HiOutlineFolder } from 'react-icons/hi';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const priorityColors = { Low: '#7575a3', Medium: '#FDCB6E', High: '#E17055', Urgent: '#FF6B6B' };

function MetricCard({ icon: Icon, iconBg, label, value, change, changeColor, changeIcon, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${changeColor}`}>
            <span>{changeIcon}</span> {change}
          </div>
        )}
      </div>
      <p className="text-dark-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, dashRes] = await Promise.all([
          api.get('/analytics/productivity'),
          api.get('/analytics/dashboard'),
        ]);
        setMetrics(prodRes.data.data);
        setDashboard(dashRes.data.data);
      } catch {
        setMetrics(null);
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Format priority distribution
  const priorityData = (dashboard?.priorityDistribution || []).map((p) => ({
    name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
    value: p.count,
    color: priorityColors[p._id.charAt(0).toUpperCase() + p._id.slice(1)] || '#7575a3',
  }));

  // Format completion trend
  const trendData = (dashboard?.completionTrend || []).map((d) => ({
    day: new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' }),
    completed: d.completed,
    total: d.total,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-dark-300 mt-1">Track team performance and productivity metrics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={HiOutlineCheckCircle} iconBg="bg-accent-green" label="Completion Rate" value={`${metrics?.completionRate ?? 0}%`} delay={0} />
        <MetricCard icon={HiOutlineClock} iconBg="bg-primary-500" label="Avg. Task Time" value={`${metrics?.avgCompletionTime ?? 0} days`} delay={0.05} />
        <MetricCard icon={HiOutlineTrendingUp} iconBg="bg-accent-blue" label="Team Velocity" value={`${metrics?.velocity ?? 0} pts`} delay={0.1} />
        <MetricCard icon={HiOutlineFolder} iconBg="bg-accent-orange" label="Active Projects" value={metrics?.activeProjects ?? 0} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-white font-semibold text-lg">Task Completion Trend</h3>
          <p className="text-dark-400 text-sm mb-4">Daily completed vs total tasks</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00CEC9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00CEC9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                <XAxis dataKey="day" stroke="#7575a3" fontSize={12} />
                <YAxis stroke="#7575a3" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#171730', border: '1px solid #2d2d5e', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="completed" stroke="#00CEC9" fill="url(#completedGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="total" stroke="#6C5CE7" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-dark-400 text-sm">No data yet. Complete tasks to see trends.</div>
          )}
        </motion.div>

        {/* Priority Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-white font-semibold text-lg">Tasks by Priority</h3>
          <p className="text-dark-400 text-sm mb-4">Distribution across priority levels</p>
          {priorityData.length > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                      {priorityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#171730', border: '1px solid #2d2d5e', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {priorityData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                    <span className="text-dark-300">{p.name}</span>
                    <span className="text-white font-medium">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-dark-400 text-sm">No tasks yet. Create tasks to see distribution.</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
