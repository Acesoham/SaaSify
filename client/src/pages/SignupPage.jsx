import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" className="input-field" required />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@company.com" className="input-field" required />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field" required />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Organization Name</label>
              <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Acme Corporation" className="input-field" required />
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

          <p className="text-dark-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
