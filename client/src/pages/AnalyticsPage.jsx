import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineTrendingUp, HiOutlineFolder } from 'react-icons/hi';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const priorityColors = { 
  Low: '#7575a3', 
  Medium: '#FDCB6E', 
  High: '#E17055', 
  Urgent: '#FF6B6B' 
};

const CHART_THEME = {
  primary: '#00CEC9',
  secondary: '#6C5CE7',
  accent: '#FDCB6E',
  grid: 'rgba(255, 255, 255, 0.03)',
  text: '#7575a3',
};

function MetricCard({ icon: Icon, iconBg, label, value, change, changeColor, changeIcon, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }} 
      className="glass-card p-6 border border-white/5 hover:border-primary-500/30 transition-all group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-all"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${changeColor}`}>
            <span>{changeIcon}</span> {change}
          </div>
        )}
      </div>
      <p className="text-dark-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 relative z-10">{label}</p>
      <p className="text-3xl font-black text-white tracking-tighter relative z-10">{value}</p>
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Analytics</h1>
          <p className="text-dark-400 text-sm mt-1">Track team performance and high-level productivity metrics</p>
        </div>
        <div className="flex gap-2">
          {/* Add date range selector if needed */}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={HiOutlineCheckCircle} iconBg="bg-accent-green shadow-accent-green/20" label="Completion Rate" value={`${metrics?.completionRate ?? 0}%`} delay={0} />
        <MetricCard icon={HiOutlineClock} iconBg="bg-primary-500 shadow-primary-500/20" label="Avg. Task Time" value={`${metrics?.avgCompletionTime ?? 0} days`} delay={0.05} />
        <MetricCard icon={HiOutlineTrendingUp} iconBg="bg-accent-blue shadow-accent-blue/20" label="Team Velocity" value={`${metrics?.velocity ?? 0} pts`} delay={0.1} />
        <MetricCard icon={HiOutlineFolder} iconBg="bg-accent-orange shadow-accent-orange/20" label="Active Projects" value={metrics?.activeProjects ?? 0} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="glass-card p-8 lg:col-span-2 border border-white/5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-black text-lg tracking-tight">Task Completion Trend</h3>
              <p className="text-dark-400 text-[10px] font-black uppercase tracking-widest mt-1">Activity over the last 7 days</p>
            </div>
          </div>
          
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_THEME.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_THEME.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_THEME.secondary} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={CHART_THEME.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={CHART_THEME.grid} vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke={CHART_THEME.text} 
                  fontSize={10} 
                  fontFamily="Inter" 
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke={CHART_THEME.text} 
                  fontSize={10} 
                  fontFamily="Inter" 
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 15, 30, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '16px', 
                    color: '#fff',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    padding: '12px 16px',
                    fontSize: '12px'
                  }} 
                  itemStyle={{ fontWeight: 800, padding: '2px 0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke={CHART_THEME.primary} 
                  fill="url(#completedGrad)" 
                  strokeWidth={4} 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={CHART_THEME.secondary} 
                  fill="url(#totalGrad)" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[320px] text-dark-500 bg-dark-900/20 rounded-3xl border-2 border-dashed border-dark-800">
               <HiOutlineClock className="w-10 h-10 mb-4 opacity-20" />
               <p className="text-sm font-black uppercase tracking-widest">Awaiting activity data</p>
            </div>
          )}
        </motion.div>

        {/* Priority Pie */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="glass-card p-8 border border-white/5 relative overflow-hidden"
        >
          <div className="mb-8">
            <h3 className="text-white font-black text-lg tracking-tight">Workload Distribution</h3>
            <p className="text-dark-400 text-[10px] font-black uppercase tracking-widest mt-1">Priority breakdown</p>
          </div>
          
          {priorityData.length > 0 ? (
            <>
              <div className="flex items-center justify-center relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-white text-2xl font-black tracking-tighter">
                    {priorityData.reduce((acc, curr) => acc + curr.value, 0)}
                  </p>
                  <p className="text-dark-500 text-[8px] font-black uppercase tracking-[0.2em]">Total Tasks</p>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie 
                      data={priorityData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={70} 
                      outerRadius={100} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      {priorityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ 
                        backgroundColor: 'rgba(15, 15, 30, 0.95)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '16px', 
                        backdropFilter: 'blur(20px)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {priorityData.map((p) => (
                  <div key={p.name} className="flex flex-col gap-1 p-3 rounded-2xl bg-dark-900/30 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                      <span className="text-dark-400 text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                    </div>
                    <span className="text-white text-lg font-black tracking-tight">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[340px] text-dark-500 bg-dark-900/20 rounded-3xl border-2 border-dashed border-dark-800">
               <p className="text-sm font-black uppercase tracking-widest">No Priority Data</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
