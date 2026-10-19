import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineCheck } from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { usePageMeta } from '../hooks/usePageMeta';

const benefits = [
  'Unlimited projects & tasks',
  'Real-time collaboration',
  'Advanced analytics',
  'DevOps deployments',
];

export default function SignupPage() {
  usePageMeta('Create Account', 'Create a free SaaSify account. Start managing projects, tasks, and team collaboration today.', true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) return; // Bot detected — silent reject
    const success = await register(name, email, password, tenantName);
    if (success) navigate('/dashboard');
  };

  const handleGoogleSignup = async () => {
    try {
      const { data } = await api.get('/auth/google/url');
      window.location.href = data.data.url;
    } catch (err) {
      console.error('Failed to init Google OAuth', err);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8F9F5' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-5/12 flex-col justify-between p-12" style={{ backgroundColor: '#171820' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C4F13B' }}>
            <span className="font-black text-sm" style={{ color: '#171820' }}>S</span>
          </div>
          <span className="text-white font-bold text-lg">SaaSify</span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-white text-2xl font-bold mb-2">Start shipping faster</h2>
            <p className="text-[#969A92] text-sm leading-relaxed">
              Join thousands of teams who manage their projects, tasks, and deployments in one unified workspace.
            </p>
          </div>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white text-sm">
                <div className="w-5 h-5 rounded-full bg-[#C4F13B]/20 flex items-center justify-center flex-shrink-0">
                  <HiOutlineCheck className="w-3 h-3 text-[#C4F13B]" />
                </div>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[#4A4D45] text-xs">© 2026 SaaSify. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#171820' }}>
              <span className="font-black text-sm" style={{ color: '#C4F13B' }}>S</span>
            </div>
            <span className="text-[#171820] font-bold text-lg">SaaSify</span>
          </div>

          <h1 className="text-2xl font-bold text-[#171820] mb-1">Create your account</h1>
          <p className="text-[#6B7068] text-sm mb-7">Start your journey with SaaSify today</p>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#C43D3D]/30 rounded-lg p-3 mb-5">
              <p className="text-[#C43D3D] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot — invisible to humans */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, overflow: 'hidden' }}>
              <label htmlFor="hp-url">Website URL</label>
              <input id="hp-url" name="url" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            <div>
              <label htmlFor="signup-name" className="text-[#171820] text-sm font-medium block mb-1.5">Full Name</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="text-[#171820] text-sm font-medium block mb-1.5">Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-[#171820] text-sm font-medium block mb-1.5">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-org" className="text-[#171820] text-sm font-medium block mb-1.5">Organization Name</label>
              <input
                id="signup-org"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Acme Inc."
                className="input-field"
                required
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
              className="w-full btn-primary justify-center py-2.5 disabled:opacity-50"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E5E7E0]" />
            <span className="text-[#969A92] text-xs">or continue with</span>
            <div className="flex-1 h-px bg-[#E5E7E0]" />
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2.5 bg-white border border-[#E5E7E0] text-[#171820] font-medium py-2.5 rounded-lg hover:bg-[#F1F3ED] hover:border-[#C4F13B]/50 transition-all"
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>

          <p className="text-[#6B7068] text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#171820] font-semibold hover:text-[#C4F13B] transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-[#969A92] text-xs text-center mt-4">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="underline hover:text-[#6B7068] transition-colors">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="underline hover:text-[#6B7068] transition-colors">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
