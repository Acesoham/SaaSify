import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineShieldCheck,
  HiOutlineUsers, HiOutlineLightningBolt, HiOutlineCheck, HiOutlineArrowRight,
  HiOutlineGlobe, HiOutlineCog, HiOutlineBell, HiMenu, HiX
} from 'react-icons/hi';

// Add global styles for better font rendering
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      background-color: #07070f;
    }
  `}} />
);

const features = [
  { icon: HiOutlineViewGrid, title: 'Kanban Boards', description: 'Visualize your workflow with drag-and-drop task boards. Track progress across Backlog, To Do, In Progress, Review, and Done.', color: 'from-primary-500 to-blue-600' },
  { icon: HiOutlineClipboardList, title: 'Project Management', description: 'Create projects, assign team members, and track progress with automated completion metrics and status updates.', color: 'from-accent-green to-accent-cyan' },
  { icon: HiOutlineChartBar, title: 'Analytics Dashboard', description: 'Real-time insights into team velocity, completion rates, priority distribution, and productivity trends.', color: 'from-accent-orange to-accent-red' },
  { icon: HiOutlineUsers, title: 'Multi-Tenant Teams', description: 'Manage multiple organizations with isolated workspaces. Invite members with role-based access control.', color: 'from-accent-pink to-primary-500' },
  { icon: HiOutlineShieldCheck, title: 'Enterprise Security', description: 'JWT authentication, bcrypt hashing, rate limiting, and tenant-level data isolation keep your data safe.', color: 'from-accent-blue to-accent-cyan' },
  { icon: HiOutlineBell, title: 'Real-Time Updates', description: 'Socket.io powered live notifications. See task changes, comments, and team updates instantly.', color: 'from-accent-yellow to-accent-orange' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/forever', desc: 'For individuals', features: ['Up to 3 projects', '50 tasks', '1 team member', 'Basic analytics'], cta: 'Get Started Free', popular: false },
  { name: 'Pro', price: '$12', period: '/user/mo', desc: 'For growing teams', features: ['Unlimited projects', 'Unlimited tasks', 'Up to 25 members', 'Advanced analytics', 'Kanban + List + Calendar', 'Priority support'], cta: 'Start Pro Trial', popular: true },
  { name: 'Enterprise', price: '$39', period: '/user/mo', desc: 'For organizations', features: ['Everything in Pro', 'Unlimited members', 'DevOps dashboard', 'SSO / SAML', 'Custom integrations', 'Dedicated support', 'SLA guarantee'], cta: 'Contact Sales', popular: false },
];

const stats = [
  { value: '10K+', label: 'Active Teams' },
  { value: '2M+', label: 'Tasks Completed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '150+', label: 'Countries' },
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070f] overflow-hidden text-dark-100 relative selection:bg-primary-500/30">
      <GlobalStyles />
      {/* Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-[1000px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[-5%] w-[35%] h-[35%] bg-accent-cyan/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-accent-pink/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${isScrolled ? 'bg-dark-950/95 backdrop-blur-2xl border-b border-white/10 py-3' : 'bg-transparent py-7'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-2xl shadow-primary-500/40 group-hover:scale-110 transition-all duration-300">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">SaaSify</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Process', 'Pricing'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase() === 'process' ? 'how-it-works' : item.toLowerCase()}`} 
                className="text-dark-300 hover:text-white transition-all text-sm font-bold tracking-wide relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-dark-300 hover:text-white transition-colors text-sm font-bold px-4 py-2">
              Login
            </Link>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(108, 92, 231, 0.7)', y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-7 py-3 rounded-xl transition-all text-sm shadow-2xl shadow-primary-500/40 border border-white/20 active:translate-y-0"
              >
                Register
              </motion.button>
            </Link>
            
            <button 
              className="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <HiX className="w-8 h-8" /> : <HiMenu className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[90] bg-dark-950 pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white py-2 border-b border-dark-800">Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white py-2 border-b border-dark-800">Process</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white py-2 border-b border-dark-800">Pricing</a>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-primary-400 py-2">Login</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary-500/15 via-primary-600/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-accent-cyan/8 rounded-full blur-[120px]"></div>
          <div className="absolute top-60 right-1/4 w-[300px] h-[300px] bg-accent-pink/8 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 bg-dark-800/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full mb-12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
          >
            <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse shadow-[0_0_10px_#00CEC9]"></div>
            <span className="bg-gradient-to-r from-accent-cyan to-primary-400 bg-clip-text text-transparent text-xs font-black uppercase tracking-[0.2em]">
              Now with real-time collaboration
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8"
          >
            Manage tasks
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-accent-cyan to-primary-400 bg-clip-text text-transparent drop-shadow-sm">
              like a pro team
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-dark-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            SaaSify is the multi-tenant task management platform built for modern teams.
            Kanban boards, analytics, real-time collaboration — everything you need, beautifully designed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(108, 92, 231, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold px-10 py-4 rounded-2xl text-lg flex items-center gap-2 shadow-xl shadow-primary-500/30"
              >
                Register Now <HiOutlineArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                className="text-dark-200 hover:text-white font-semibold px-10 py-4 rounded-2xl border border-dark-600/40 hover:border-primary-500/50 transition-all text-lg backdrop-blur-sm"
              >
                See Features
              </motion.button>
            </a>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-28 relative max-w-5xl mx-auto px-4 md:px-0"
          >
            <div className="bg-dark-800/95 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] relative z-10 transition-all hover:scale-[1.01] duration-700">
              <div className="bg-[#0b0b18] rounded-[2.5rem] p-10 border border-white/5 shadow-inner">
                {/* Mini dashboard mockup */}
                <div className="flex items-center gap-6 mb-12">
                  <div className="flex gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#FF5F57] shadow-lg shadow-[#FF5F57]/40"></div>
                    <div className="w-4 h-4 rounded-full bg-[#FEB62C] shadow-lg shadow-[#FEB62C]/40"></div>
                    <div className="w-4 h-4 rounded-full bg-[#28C840] shadow-lg shadow-[#28C840]/40"></div>
                  </div>
                  <div className="flex-1 bg-dark-800/95 rounded-2xl h-12 max-w-md mx-auto border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {[{ l: 'Tasks', v: '24', c: 'bg-primary-500' }, { l: 'In Progress', v: '8', c: 'bg-accent-cyan' }, { l: 'Done', v: '12', c: 'bg-accent-green' }, { l: 'Urgent', v: '4', c: 'bg-accent-red' }].map((s) => (
                    <div key={s.l} className="bg-dark-800/90 border border-white/10 rounded-[1.5rem] p-7 hover:bg-dark-700 transition-all duration-300 group cursor-default shadow-lg">
                      <p className="text-dark-400 text-[11px] uppercase font-black tracking-[0.25em] mb-1">{s.l}</p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-white font-black text-4xl group-hover:scale-110 transition-transform origin-left tracking-tighter">{s.v}</p>
                        <div className={`w-12 h-12 rounded-xl ${s.c} shadow-2xl shadow-black/40 flex items-center justify-center border border-white/10`}>
                          <div className="w-5 h-5 bg-white/30 rounded-md italic font-black text-[10px] text-white flex items-center justify-center">S</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-dark-800/90 border border-white/10 rounded-[2rem] p-10 h-56 relative overflow-hidden group shadow-lg">
                    <div className="flex gap-3 h-full items-end relative z-10">
                      {[40, 65, 50, 80, 60, 45, 70, 55, 90, 75, 65, 85].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-xl shadow-lg transition-all duration-700 hover:brightness-150 cursor-pointer" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-primary-500/5 group-hover:bg-primary-500/10 transition-colors"></div>
                  </div>
                  <div className="bg-dark-800/90 border border-white/10 rounded-[2rem] p-10 h-56 relative overflow-hidden group shadow-lg">
                    <div className="flex gap-4 h-full items-end relative z-10">
                      {[70, 50, 85, 40, 65, 80].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-accent-cyan to-accent-cyan/80 rounded-t-xl shadow-lg transition-all duration-700 hover:brightness-150 cursor-pointer" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-accent-cyan/5 group-hover:bg-accent-cyan/10 transition-colors"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under preview */}
            <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[140%] h-80 bg-primary-500/25 blur-[180px] rounded-full z-0 pointer-events-none"></div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-dark-400 text-[11px] font-black uppercase tracking-[0.3em] mb-12">Trusted by innovative teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000">
             <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter transition-transform hover:scale-110"><HiOutlineGlobe className="w-7 h-7 text-primary-400"/> VORTEX</div>
             <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter transition-transform hover:scale-110"><HiOutlineLightningBolt className="w-7 h-7 text-accent-yellow"/> NEXUS</div>
             <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter transition-transform hover:scale-110"><HiOutlineShieldCheck className="w-7 h-7 text-accent-green"/> SECURE</div>
             <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter transition-transform hover:scale-110"><HiOutlineUsers className="w-7 h-7 text-accent-pink"/> ATOM</div>
             <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter transition-transform hover:scale-110"><HiOutlineCog className="w-7 h-7 text-accent-cyan"/> SYNC</div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-16 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dark-700/50 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dark-700/50 to-transparent"></div>
        
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center relative group"
            >
              <div className="absolute inset-0 bg-primary-500/5 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700"></div>
              <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent relative z-10">
                {stat.value}
              </p>
              <p className="text-dark-400 text-sm mt-2 font-medium tracking-wide relative z-10 uppercase">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 text-sm font-semibold uppercase tracking-wider">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">Everything you need to ship faster</h2>
            <p className="text-dark-300 text-lg mt-4 max-w-2xl mx-auto">
              Built for modern engineering and product teams who need more than a basic to-do list.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative p-8 rounded-3xl bg-dark-900/40 border border-dark-700/50 hover:border-primary-500/50 hover:bg-dark-800/60 transition-all duration-500 overflow-hidden"
              >
                {/* Decorative background glow */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}></div>
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-primary-300 transition-colors">{feature.title}</h3>
                <p className="text-dark-400 text-base leading-relaxed group-hover:text-dark-300 transition-colors">{feature.description}</p>
                
                <div className="mt-6 flex items-center gap-2 text-primary-400 text-sm font-semibold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                  Learn more <HiOutlineArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-dark-950/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700/30 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-accent-cyan text-sm font-semibold uppercase tracking-wider">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">Simplify your team's workflow</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-dark-700/50 to-transparent -translate-y-1/2 z-0"></div>

            {[
              { step: '01', title: 'Register team', desc: 'Create your organization and invite members in seconds.', icon: HiOutlineUsers, border: 'border-primary-500/30' },
              { step: '02', title: 'Create projects', desc: 'Set up kanban boards and tasks with priorities.', icon: HiOutlineClipboardList, border: 'border-accent-cyan/30' },
              { step: '03', title: 'Ship faster', desc: 'Track progress with real-time analytics and deliver.', icon: HiOutlineLightningBolt, border: 'border-accent-green/30' },
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-20 h-20 rounded-full bg-dark-900 border-2 ${item.border} flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-primary-500/50`}>
                  <item.icon className="w-8 h-8 text-white group-hover:text-primary-400 transition-colors" />
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border-4 border-dark-950">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-primary-300 transition-colors">{item.title}</h3>
                <p className="text-dark-400 max-w-xs mx-auto leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary-500/8 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 text-sm font-semibold uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">Plans for every team size</h2>
            <p className="text-dark-300 text-lg mt-4">Start free. Scale as you grow.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 ${plan.popular ? 'bg-gradient-to-b from-primary-500/20 to-dark-800/80 border-2 border-primary-500/40 relative' : 'glass-card'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-white font-semibold text-xl">{plan.name}</h3>
                <p className="text-dark-400 text-sm mt-1">{plan.desc}</p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-dark-400 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-dark-300 text-sm">
                      <HiOutlineCheck className="w-4 h-4 text-accent-green flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                      plan.popular
                        ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                        : 'border border-dark-600/40 text-dark-200 hover:text-white hover:border-dark-500/60'
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary-500/10 to-dark-800/50 border border-primary-500/20 rounded-3xl p-12 md:p-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-cyan/10 rounded-full blur-[60px]"></div>

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Ready to supercharge
              <br />
              your team's workflow?
            </h2>
            <p className="text-dark-300 text-lg mt-4 max-w-xl mx-auto">
              Join thousands of teams already using SaaSify to ship faster, collaborate better, and stay organized.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(108, 92, 231, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-primary-600 font-bold px-10 py-4 rounded-2xl text-lg flex items-center gap-2 shadow-2xl shadow-white/10"
                >
                  Register for Free <HiOutlineArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
            <p className="text-dark-500 text-sm mt-4">No credit card required · Free forever plan available</p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700/30 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="text-white font-bold text-lg">SaaSify</span>
              </div>
              <p className="text-dark-400 text-sm">Multi-tenant task management built for modern teams.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'API Docs', 'Status', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-dark-400 hover:text-white text-sm transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-700/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-dark-500 text-sm">© 2026 SaaSify. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Cookies'].map((l) => (
                <a key={l} href="#" className="text-dark-500 hover:text-dark-300 text-sm transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
