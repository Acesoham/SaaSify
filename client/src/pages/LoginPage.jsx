import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

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

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[128px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">SaaSify</span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome back</h1>
          <p className="text-dark-400 text-center mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-3 mb-4">
              <p className="text-accent-red text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@acme.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Password</label>
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
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-dark-400 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 hover:underline">Create one</Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-xl bg-dark-800/40 border border-dark-600/20">
            <p className="text-dark-400 text-xs text-center mb-1">Demo credentials</p>
            <p className="text-dark-300 text-xs text-center font-mono">sarah@acme.com / password123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
