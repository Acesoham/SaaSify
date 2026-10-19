import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineTrendingUp, HiOutlineFolder } from 'react-icons/hi';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const priorityColors = {
  Low:    '#969A92',
  Medium: '#3478B9',
  High:   '#A96612',
  Urgent: '#C43D3D',
};

const CHART_THEME = {
  primary:   '#C4F13B',
  secondary: '#3478B9',
  grid:      '#F1F3ED',
  text:      '#969A92',
};

function MetricCard({ icon: Icon, iconBg, label, value, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-[#E5E7E0] rounded-xl p-5 shadow-[0_1px_3px_rgba(23,24,32,0.06)] hover:shadow-[0_4px_12px_rgba(23,24,32,0.08)] transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-[#969A92] text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#171820]">{value}</p>
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

  const priorityData = (dashboard?.priorityDistribution || []).map((p) => ({
    name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
    value: p.count,
    color: priorityColors[p._id.charAt(0).toUpperCase() + p._id.slice(1)] || '#969A92',
  }));

  const trendData = (dashboard?.completionTrend || []).map((d) => ({
    day: new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' }),
    completed: d.completed,
    total: d.total,
  }));

  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #E5E7E0',
    borderRadius: '10px',
    color: '#171820',
    boxShadow: '0 4px 12px rgba(23,24,32,0.1)',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#171820]">Analytics</h1>
        <p className="text-[#6B7068] text-sm mt-0.5">Track team performance and productivity metrics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={HiOutlineCheckCircle} iconBg="bg-[#EFF9D4]"       label="Completion Rate"  value={`${metrics?.completionRate ?? 0}%`}      delay={0} />
        <MetricCard icon={HiOutlineClock}        iconBg="bg-[#EFF9D4]"       label="Avg. Task Time"   value={`${metrics?.avgCompletionTime ?? 0} days`} delay={0.05} />
        <MetricCard icon={HiOutlineTrendingUp}   iconBg="bg-[#3478B9]/10"   label="Team Velocity"    value={`${metrics?.velocity ?? 0} pts`}           delay={0.1} />
        <MetricCard icon={HiOutlineFolder}        iconBg="bg-[#A96612]/10"   label="Active Projects"  value={metrics?.activeProjects ?? 0}               delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 shadow-[0_1px_3px_rgba(23,24,32,0.06)] lg:col-span-2"
        >
          <div className="mb-5">
            <h3 className="text-[#171820] font-semibold text-base">Task Completion Trend</h3>
            <p className="text-[#969A92] text-xs mt-0.5">Activity over the last 7 days</p>
          </div>

          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_THEME.primary}   stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_THEME.primary}   stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_THEME.secondary} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={CHART_THEME.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={CHART_THEME.grid} vertical={false} />
                <XAxis dataKey="day" stroke={CHART_THEME.text} fontSize={11} axisLine={false} tickLine={false} dy={6} />
                <YAxis stroke={CHART_THEME.text} fontSize={11} axisLine={false} tickLine={false} dx={-6} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="completed" stroke={CHART_THEME.primary}   fill="url(#completedGrad)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="total"     stroke={CHART_THEME.secondary} fill="url(#totalGrad)"    strokeWidth={2}   strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#969A92] bg-[#F8F9F5] rounded-lg border-2 border-dashed border-[#E5E7E0]">
              <HiOutlineClock className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">Awaiting activity data</p>
            </div>
          )}
        </motion.div>

        {/* Priority Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 shadow-[0_1px_3px_rgba(23,24,32,0.06)]"
        >
          <div className="mb-5">
            <h3 className="text-[#171820] font-semibold text-base">Workload Distribution</h3>
            <p className="text-[#969A92] text-xs mt-0.5">Priority breakdown</p>
          </div>

          {priorityData.length > 0 ? (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[#171820] text-2xl font-bold">
                    {priorityData.reduce((acc, curr) => acc + curr.value, 0)}
                  </p>
                  <p className="text-[#969A92] text-[10px] font-medium">Total Tasks</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {priorityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {priorityData.map((p) => (
                  <div key={p.name} className="flex flex-col gap-1 p-2.5 rounded-lg bg-[#F8F9F5] border border-[#E5E7E0]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-[#6B7068] text-[10px] font-medium">{p.name}</span>
                    </div>
                    <span className="text-[#171820] text-base font-bold">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#969A92] bg-[#F8F9F5] rounded-lg border-2 border-dashed border-[#E5E7E0]">
              <p className="text-sm">No priority data</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
