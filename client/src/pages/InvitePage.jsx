import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineArrowRight } from 'react-icons/hi';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, acceptInvite } = useAuthStore();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data } = await api.get(`/auth/invite/${token}`);
        setInvite(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptInvite(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HiOutlineShieldCheck className="w-8 h-8 text-accent-red" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invitation Error</h1>
          <p className="text-dark-400 mb-8">{error}</p>
          <Link 
            to="/" 
            className="inline-block w-full bg-dark-800 text-white py-3 rounded-xl font-semibold hover:bg-dark-700 transition-all border border-white/5"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[128px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card p-8 text-center border border-white/10">
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">SaaSify</span>
          </div>

          <div className="w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
            <HiOutlineUserGroup className="w-10 h-10 text-primary-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">You're invited!</h1>
          <p className="text-dark-400 mb-8">
            <span className="text-white font-semibold">{invite.invitedBy}</span> has invited you to join <br />
            <span className="text-primary-400 font-bold text-lg">"{invite.tenantName}"</span>
          </p>

          <div className="bg-dark-900/50 rounded-2xl p-4 mb-8 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6 text-accent-cyan" />
            </div>
            <div className="text-left">
              <p className="text-dark-300 text-xs font-black uppercase tracking-widest">Assigned Role</p>
              <p className="text-white font-bold">{invite.role}</p>
            </div>
          </div>

          {user ? (
            <motion.button
              disabled={accepting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              className="w-full bg-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 group"
            >
              {accepting ? 'Joining...' : 'Accept Invitation'}
              <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <div className="space-y-4">
              <Link 
                to={`/signup?invite=${token}`}
                className="block w-full bg-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/20"
              >
                Create account to join
              </Link>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-dark-500 text-xs font-black uppercase tracking-widest">or</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <Link 
                to={`/login?redirect=/invite/${token}`}
                className="block w-full bg-dark-800 text-white py-4 rounded-xl font-bold border border-white/5 hover:bg-dark-700 transition-all"
              >
                Sign in to accept
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
