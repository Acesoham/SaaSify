import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
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
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12" style={{ backgroundColor: '#171820' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C4F13B' }}>
            <span className="font-black text-sm" style={{ color: '#171820' }}>S</span>
          </div>
          <span className="text-white font-bold text-lg">SaaSify</span>
        </div>

        <div>
          <blockquote className="text-white text-2xl font-semibold leading-snug mb-4">
            "SaaSify helped our team ship 3x faster with better visibility into every task and project."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C4F13B] flex items-center justify-center text-[#171820] font-bold text-sm">A</div>
            <div>
              <p className="text-white text-sm font-semibold">Alex Chen</p>
              <p className="text-[#969A92] text-xs">CTO at Nexus Labs</p>
            </div>
          </div>
        </div>

        <p className="text-[#4A4D45] text-xs">© 2026 SaaSify. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
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

          <h1 className="text-2xl font-bold text-[#171820] mb-1">Welcome back</h1>
          <p className="text-[#6B7068] text-sm mb-7">Sign in to your account to continue</p>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#C43D3D]/30 rounded-lg p-3 mb-5">
              <p className="text-[#C43D3D] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#171820] text-sm font-medium block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-[#171820] text-sm font-medium block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {isLoading ? 'Signing in…' : 'Sign In'}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E5E7E0]" />
            <span className="text-[#969A92] text-xs">or continue with</span>
            <div className="flex-1 h-px bg-[#E5E7E0]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 bg-white border border-[#E5E7E0] text-[#171820] font-medium py-2.5 rounded-lg hover:bg-[#F1F3ED] hover:border-[#C4F13B]/50 transition-all"
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>

          <p className="text-[#6B7068] text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#171820] font-semibold hover:text-[#C4F13B] transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
