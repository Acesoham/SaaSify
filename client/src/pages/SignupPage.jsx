import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-[128px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">SaaSify</span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Create your account</h1>
          <p className="text-dark-400 text-center mb-8">Start your journey with SaaSify</p>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-3 mb-4">
              <p className="text-accent-red text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}  className="input-field" required />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}  className="input-field" required />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}   className="input-field" required />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Organization Name</label>
              <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="input-field" required />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-950/80 text-dark-400">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignup}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-white font-medium py-3 rounded-xl border border-dark-600/50 transition-colors"
            >
              <FcGoogle className="text-xl" />
              Google
            </button>
          </div>

          <p className="text-dark-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
