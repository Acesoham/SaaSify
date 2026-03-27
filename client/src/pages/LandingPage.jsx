import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineShieldCheck,
  HiOutlineUsers, HiOutlineLightningBolt, HiOutlineCheck, HiOutlineArrowRight,
  HiOutlineGlobe, HiOutlineCog, HiOutlineBell,
} from 'react-icons/hi';

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
  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-50 border-b border-dark-700/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SaaSify</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-dark-200 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-dark-200 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#testimonials" className="text-dark-200 hover:text-white transition-colors text-sm font-medium">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-dark-200 hover:text-white transition-colors text-sm font-medium px-4 py-2">
              Sign In
            </Link>
            <Link to="/signup">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-5 py-2 rounded-xl transition-all text-sm">
                Get Started Free
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

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
            className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8"
          >
            <HiOutlineLightningBolt className="w-4 h-4" />
            Now with real-time collaboration
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight"
          >
            Manage tasks
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-accent-cyan to-primary-400 bg-clip-text text-transparent">
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
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(108, 92, 231, 0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base flex items-center gap-2 shadow-lg shadow-primary-500/20"
              >
                Start Free Trial <HiOutlineArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="text-dark-200 hover:text-white font-medium px-8 py-3.5 rounded-xl border border-dark-600/40 hover:border-dark-500/60 transition-all text-base"
              >
                See Features
              </motion.button>
            </a>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-600/30 rounded-2xl p-2 shadow-2xl shadow-black/40">
              <div className="bg-dark-900/80 rounded-xl p-6">
                {/* Mini dashboard mockup */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-accent-red"></div>
                  <div className="w-3 h-3 rounded-full bg-accent-yellow"></div>
                  <div className="w-3 h-3 rounded-full bg-accent-green"></div>
                  <div className="flex-1 bg-dark-800/50 rounded-md h-6 max-w-xs mx-auto"></div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[{ l: 'Tasks', v: '24', c: 'bg-primary-500' }, { l: 'In Progress', v: '8', c: 'bg-accent-cyan' }, { l: 'Done', v: '12', c: 'bg-accent-green' }, { l: 'Urgent', v: '4', c: 'bg-accent-red' }].map((s) => (
                    <div key={s.l} className="bg-dark-800/40 border border-dark-600/20 rounded-xl p-3">
                      <p className="text-dark-400 text-xs">{s.l}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-white font-bold text-lg">{s.v}</p>
                        <div className={`w-6 h-6 rounded-md ${s.c} opacity-60`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-800/40 border border-dark-600/20 rounded-xl p-4 h-32">
                    <div className="flex gap-1 h-full items-end">
                      {[40, 65, 50, 80, 60, 45, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-primary-500/60 to-primary-500/20 rounded-sm" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-dark-800/40 border border-dark-600/20 rounded-xl p-4 h-32">
                    <div className="flex gap-1 h-full items-end">
                      {[70, 50, 85, 40].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-accent-cyan/60 to-accent-cyan/20 rounded-sm" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under preview */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary-500/20 blur-3xl rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-16 border-y border-dark-700/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-dark-400 text-sm mt-1">{stat.label}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
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
                  whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(108, 92, 231, 0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold px-8 py-4 rounded-xl text-base flex items-center gap-2 shadow-lg shadow-primary-500/25"
                >
                  Get Started for Free <HiOutlineArrowRight className="w-5 h-5" />
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
