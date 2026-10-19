import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineShieldCheck,
  HiOutlineUsers, HiOutlineLightningBolt, HiOutlineCheck, HiOutlineArrowRight,
  HiOutlineGlobe, HiOutlineCog, HiOutlineBell, HiMenu, HiX,
} from 'react-icons/hi';
import { usePageMeta } from '../hooks/usePageMeta';

const features = [
  { icon: HiOutlineViewGrid,      title: 'Kanban Boards',       description: 'Visualize your workflow with drag-and-drop task boards. Track progress across Backlog, To Do, In Progress, Review, and Done.', accent: '#C4F13B' },
  { icon: HiOutlineClipboardList, title: 'Project Management',  description: 'Create projects, assign team members, and track progress with automated completion metrics and status updates.',            accent: '#3478B9' },
  { icon: HiOutlineChartBar,      title: 'Analytics Dashboard', description: 'Real-time insights into team velocity, completion rates, priority distribution, and productivity trends.',                    accent: '#A96612' },
  { icon: HiOutlineUsers,         title: 'Multi-Tenant Teams',  description: 'Manage multiple organizations with isolated workspaces. Invite members with role-based access control.',                      accent: '#287D48' },
  { icon: HiOutlineShieldCheck,   title: 'Enterprise Security', description: 'JWT authentication, bcrypt hashing, rate limiting, and tenant-level data isolation keep your data safe.',                    accent: '#C43D3D' },
  { icon: HiOutlineBell,          title: 'Real-Time Updates',   description: 'Socket.io powered live notifications. See task changes, comments, and team updates instantly.',                               accent: '#8B5CF6' },
];

const plans = [
  {
    name: 'Free', price: '$0', period: '/forever', desc: 'For individuals',
    features: ['Up to 3 projects', '50 tasks', '1 team member', 'Basic analytics'],
    cta: 'Get Started Free', popular: false,
  },
  {
    name: 'Pro', price: '$12', period: '/user/mo', desc: 'For growing teams',
    features: ['Unlimited projects', 'Unlimited tasks', 'Up to 25 members', 'Advanced analytics', 'Kanban + List + Calendar', 'Priority support'],
    cta: 'Start Pro Trial', popular: true,
  },
  {
    name: 'Enterprise', price: '$39', period: '/user/mo', desc: 'For organizations',
    features: ['Everything in Pro', 'Unlimited members', 'DevOps dashboard', 'SSO / SAML', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact Sales', popular: false,
  },
];

const stats = [
  { value: '10K+', label: 'Active Teams' },
  { value: '2M+',  label: 'Tasks Completed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '150+', label: 'Countries' },
];

const STEPS = [
  { step: '01', title: 'Register your team',  desc: 'Create your organization and invite members in seconds.',          icon: HiOutlineUsers },
  { step: '02', title: 'Create projects',      desc: 'Set up kanban boards and tasks with priorities.',                  icon: HiOutlineClipboardList },
  { step: '03', title: 'Ship faster',          desc: 'Track progress with real-time analytics and deliver.',             icon: HiOutlineLightningBolt },
];

export default function LandingPage() {
  usePageMeta(
    'Project & Task Management for Modern Teams',
    'SaaSify is a multi-tenant project and task management platform. Kanban boards, real-time collaboration, analytics, and DevOps deployments — all in one place.',
    false
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#F8F9F5', color: '#171820' }}>

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#E5E7E0] py-3 shadow-sm'
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#171820' }}>
              <span className="font-black text-sm" style={{ color: '#C4F13B' }}>S</span>
            </div>
            <span className="font-black text-xl text-[#171820]">SaaSify</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-9">
            {['Features', 'Process', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase() === 'process' ? 'how-it-works' : item.toLowerCase()}`}
                className="text-[#6B7068] hover:text-[#171820] transition-colors text-sm font-semibold relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C4F13B] transition-all duration-300 group-hover:w-full rounded-full" />
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-[#6B7068] hover:text-[#171820] transition-colors text-sm font-semibold px-4 py-2"
            >
              Login
            </Link>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-[#171820] hover:bg-[#2a2d38] text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-md"
              >
                Get Started
              </motion.button>
            </Link>
            <button
              className="md:hidden p-2 text-[#6B7068] hover:text-[#171820] transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-white pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-4 text-center">
              {[
                { label: 'Features',  href: '#features'   },
                { label: 'Process',   href: '#how-it-works'},
                { label: 'Pricing',   href: '#pricing'     },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xl font-bold text-[#171820] py-3 border-b border-[#E5E7E0]"
                >
                  {label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-bold text-[#6B7068] py-3"
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6">
        {/* Soft lime blob */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(196,241,59,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white border border-[#E5E7E0] shadow-sm px-5 py-2 rounded-full mb-10"
          >
            <div className="w-2 h-2 rounded-full bg-[#C4F13B] animate-pulse" />
            <span className="text-[#6B7068] text-xs font-bold uppercase tracking-widest">
              Now with real-time collaboration
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-[#171820] leading-[1.05] tracking-tight mb-6"
          >
            Manage tasks
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #171820 0%, #4a4d3a 50%, #C4F13B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              like a pro team
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-[#6B7068] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
          >
            SaaSify is the multi-tenant task management platform built for modern teams.
            Kanban boards, analytics, real-time collaboration — everything you need, beautifully designed.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] font-bold px-8 py-4 rounded-2xl text-base flex items-center gap-2 shadow-lg shadow-[#C4F13B]/30 transition-all"
              >
                Start for Free <HiOutlineArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="text-[#6B7068] hover:text-[#171820] font-semibold px-8 py-4 rounded-2xl border border-[#E5E7E0] hover:border-[#C4F13B]/50 hover:bg-white transition-all text-base"
              >
                See Features
              </motion.button>
            </a>
          </motion.div>

          {/* Dashboard preview mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 relative"
          >
            {/* Soft glow under card */}
            <div
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-full pointer-events-none"
              style={{ background: 'rgba(196,241,59,0.25)', filter: 'blur(50px)' }}
            />

            <div className="bg-white border border-[#E5E7E0] rounded-3xl p-4 shadow-[0_24px_80px_rgba(23,24,32,0.12)] hover:shadow-[0_32px_100px_rgba(23,24,32,0.15)] transition-shadow duration-700 relative z-10">
              {/* Browser chrome */}
              <div className="bg-[#F8F9F5] rounded-2xl border border-[#E5E7E0] p-6">
                {/* Dots + URL bar */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FEB62C]" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 bg-white border border-[#E5E7E0] rounded-lg h-9 max-w-sm mx-auto flex items-center px-3">
                    <span className="text-[#969A92] text-xs">app.saasify.com/dashboard</span>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { l: 'Total Tasks', v: '24', accent: '#C4F13B' },
                    { l: 'In Progress', v: '8',  accent: '#3478B9' },
                    { l: 'Completed',   v: '12', accent: '#287D48' },
                    { l: 'Urgent',      v: '4',  accent: '#C43D3D' },
                  ].map((s) => (
                    <div key={s.l} className="bg-white border border-[#E5E7E0] rounded-xl p-4 shadow-sm">
                      <p className="text-[#969A92] text-[10px] font-semibold uppercase tracking-wider mb-2">{s.l}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[#171820] font-black text-3xl">{s.v}</p>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + '20' }}>
                          <div className="w-4 h-4 rounded-md" style={{ backgroundColor: s.accent }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E5E7E0] rounded-xl p-5 h-44 flex flex-col justify-end overflow-hidden">
                    <p className="text-[#969A92] text-[10px] font-semibold uppercase tracking-wider mb-3">Task completion</p>
                    <div className="flex gap-1.5 items-end h-24">
                      {[40, 65, 50, 80, 60, 45, 70, 55, 90, 75, 65, 85].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md transition-all duration-700"
                          style={{ height: `${h}%`, backgroundColor: i === 8 ? '#C4F13B' : '#EFF9D4' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E7E0] rounded-xl p-5 h-44 flex flex-col justify-end overflow-hidden">
                    <p className="text-[#969A92] text-[10px] font-semibold uppercase tracking-wider mb-3">Velocity</p>
                    <div className="flex gap-2 items-end h-24">
                      {[70, 50, 85, 40, 65, 80].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md transition-all duration-700"
                          style={{ height: `${h}%`, backgroundColor: i === 2 ? '#3478B9' : '#EFF5FF' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trusted By ────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-[#E5E7E0]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#969A92] text-[11px] font-bold uppercase tracking-widest mb-10">
            Trusted by innovative teams at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 hover:opacity-100 transition-all duration-700">
            {[
              { label: 'VORTEX', icon: HiOutlineGlobe },
              { label: 'NEXUS',  icon: HiOutlineLightningBolt },
              { label: 'SECURE', icon: HiOutlineShieldCheck },
              { label: 'ATOM',   icon: HiOutlineUsers },
              { label: 'SYNC',   icon: HiOutlineCog },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2.5 text-[#171820] font-black text-lg tracking-tight hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-[#969A92]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-y border-[#E5E7E0]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-black text-[#171820] mb-1">{stat.value}</p>
              <p className="text-[#969A92] text-sm font-medium uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 bg-[#EFF9D4] text-[#171820] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#171820] mt-3">
              Everything you need to ship faster
            </h2>
            <p className="text-[#6B7068] text-lg mt-4 max-w-2xl mx-auto">
              Built for modern engineering and product teams who need more than a basic to-do list.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group bg-white border border-[#E5E7E0] hover:border-[#C4F13B]/60 rounded-2xl p-7 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(23,24,32,0.08)] cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: feature.accent + '18' }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.accent }} />
                </div>
                <h3 className="text-[#171820] font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-[#6B7068] text-sm leading-relaxed">{feature.description}</p>
                <div className="mt-5 flex items-center gap-1.5 text-[#C4F13B] text-xs font-bold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  Learn more <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white border-y border-[#E5E7E0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center bg-[#EFF9D4] text-[#171820] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Process
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#171820] mt-3">
              Simplify your team's workflow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-px bg-[#E5E7E0] z-0" />

            {STEPS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-full bg-white border-2 border-[#E5E7E0] group-hover:border-[#C4F13B] flex items-center justify-center mb-6 shadow-sm transition-all duration-300 group-hover:shadow-[0_4px_20px_rgba(196,241,59,0.25)] relative">
                  <item.icon className="w-8 h-8 text-[#6B7068] group-hover:text-[#171820] transition-colors" />
                  <span className="absolute -top-2.5 -right-2.5 bg-[#C4F13B] text-[#171820] text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-[#171820] font-bold text-lg mb-2 group-hover:text-[#171820] transition-colors">{item.title}</h3>
                <p className="text-[#6B7068] text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center bg-[#EFF9D4] text-[#171820] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#171820] mt-3">Plans for every team size</h2>
            <p className="text-[#6B7068] text-lg mt-4">Start free. Scale as you grow.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-7 relative flex flex-col ${
                  plan.popular
                    ? 'bg-[#171820] border-2 border-[#171820] shadow-[0_20px_60px_rgba(23,24,32,0.2)]'
                    : 'bg-white border border-[#E5E7E0] shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C4F13B] text-[#171820] text-xs font-black px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="flex-1">
                  <h3 className={`font-bold text-xl ${plan.popular ? 'text-white' : 'text-[#171820]'}`}>{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-[#969A92]' : 'text-[#6B7068]'}`}>{plan.desc}</p>
                  <div className="mt-5 mb-6">
                    <span className={`text-4xl font-black ${plan.popular ? 'text-white' : 'text-[#171820]'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-[#969A92]' : 'text-[#6B7068]'}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-[#C4F13B]/20' : 'bg-[#EFF9D4]'}`}>
                          <HiOutlineCheck className={`w-2.5 h-2.5 ${plan.popular ? 'text-[#C4F13B]' : 'text-[#287D48]'}`} />
                        </div>
                        <span className={plan.popular ? 'text-[#D1D5DB]' : 'text-[#6B7068]'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.popular
                        ? 'bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] shadow-lg shadow-[#C4F13B]/25'
                        : 'bg-[#F8F9F5] hover:bg-[#EFF9D4] text-[#171820] border border-[#E5E7E0] hover:border-[#C4F13B]/40'
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

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-[#171820] rounded-3xl p-12 md:p-16 relative overflow-hidden"
        >
          {/* Decorative lime blob */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'rgba(196,241,59,0.12)', filter: 'blur(60px)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'rgba(196,241,59,0.08)', filter: 'blur(50px)' }}
          />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Ready to supercharge
              <br />
              <span style={{ color: '#C4F13B' }}>your team's workflow?</span>
            </h2>
            <p className="text-[#969A92] text-lg mt-4 max-w-xl mx-auto">
              Join thousands of teams already using SaaSify to ship faster, collaborate better, and stay organized.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] font-bold px-10 py-4 rounded-2xl text-lg flex items-center gap-2 shadow-xl shadow-[#C4F13B]/25 transition-all"
                >
                  Register for Free <HiOutlineArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
            <p className="text-[#4B5563] text-sm mt-4">No credit card required · Free forever plan available</p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E7E0] py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4" aria-label="SaaSify home">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#171820' }}>
                  <span className="font-black text-xs" style={{ color: '#C4F13B' }}>S</span>
                </div>
                <span className="text-[#171820] font-bold text-lg">SaaSify</span>
              </Link>
              <p className="text-[#969A92] text-sm leading-relaxed">
                Multi-tenant task management built for modern teams.
              </p>
            </div>
            {[
              { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }] },
              { title: 'Legal',   links: [{ label: 'Privacy Policy', href: '/privacy-policy', internal: true }, { label: 'Terms of Service', href: '/terms', internal: true }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[#171820] font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.internal
                        ? <Link to={link.href} className="text-[#969A92] hover:text-[#171820] text-sm transition-colors">{link.label}</Link>
                        : <a href={link.href} className="text-[#969A92] hover:text-[#171820] text-sm transition-colors">{link.label}</a>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E5E7E0] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#969A92] text-sm">© 2026 SaaSify. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-[#969A92] hover:text-[#171820] text-sm transition-colors">Privacy Policy</Link>
              <Link to="/terms"          className="text-[#969A92] hover:text-[#171820] text-sm transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
