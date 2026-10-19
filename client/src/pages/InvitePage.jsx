import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineArrowRight } from 'react-icons/hi';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePageMeta } from '../hooks/usePageMeta';

export default function InvitePage() {
  usePageMeta('Team Invitation', 'You have been invited to join a workspace on SaaSify.', true);
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9F5' }}>
        <div className="w-10 h-10 border-2 border-[#E5E7E0] border-t-[#C4F13B] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F9F5' }}>
        <div className="bg-white border border-[#E5E7E0] rounded-2xl p-8 max-w-md w-full text-center shadow-[0_4px_20px_rgba(23,24,32,0.08)]">
          <div className="w-14 h-14 bg-[#FEF2F2] rounded-xl flex items-center justify-center mx-auto mb-5">
            <HiOutlineShieldCheck className="w-7 h-7 text-[#C43D3D]" />
          </div>
          <h1 className="text-xl font-bold text-[#171820] mb-2">Invitation Error</h1>
          <p className="text-[#6B7068] mb-7 text-sm">{error}</p>
          <Link
            to="/"
            className="inline-block w-full bg-[#F1F3ED] hover:bg-[#E5E7E0] text-[#171820] py-3 rounded-xl font-semibold transition-all text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F9F5' }}>
      {/* Soft background blob */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(196,241,59,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white border border-[#E5E7E0] rounded-2xl p-8 text-center shadow-[0_8px_40px_rgba(23,24,32,0.1)]">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-7" aria-label="SaaSify home">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#171820' }}>
              <span className="font-black text-sm" style={{ color: '#C4F13B' }}>S</span>
            </div>
            <span className="text-[#171820] font-bold text-lg">SaaSify</span>
          </Link>

          {/* Icon */}
          <div className="w-16 h-16 bg-[#EFF9D4] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HiOutlineUserGroup className="w-8 h-8 text-[#171820]" />
          </div>

          <h1 className="text-2xl font-bold text-[#171820] mb-2">You're invited!</h1>
          <p className="text-[#6B7068] mb-6 text-sm leading-relaxed">
            <span className="text-[#171820] font-semibold">{invite.invitedBy}</span> has invited you to join{' '}
            <br />
            <span className="font-bold text-[#171820]">"{invite.tenantName}"</span>
          </p>

          {/* Role badge */}
          <div className="bg-[#F8F9F5] border border-[#E5E7E0] rounded-xl p-3.5 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EFF9D4] rounded-lg flex items-center justify-center flex-shrink-0">
              <HiOutlineShieldCheck className="w-5 h-5 text-[#171820]" />
            </div>
            <div className="text-left">
              <p className="text-[#969A92] text-[10px] font-bold uppercase tracking-widest">Assigned Role</p>
              <p className="text-[#171820] font-semibold text-sm capitalize">{invite.role}</p>
            </div>
          </div>

          {user ? (
            <motion.button
              disabled={accepting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              className="w-full bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] py-3.5 rounded-xl font-bold shadow-md shadow-[#C4F13B]/20 flex items-center justify-center gap-2 group transition-all disabled:opacity-50"
            >
              {accepting ? 'Joining...' : 'Accept Invitation'}
              <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <div className="space-y-3">
              <Link
                to={`/signup?invite=${token}`}
                className="block w-full bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] py-3.5 rounded-xl font-bold transition-all text-sm"
              >
                Create account to join
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E5E7E0]" />
                <span className="text-[#969A92] text-xs font-semibold uppercase tracking-widest">or</span>
                <div className="h-px flex-1 bg-[#E5E7E0]" />
              </div>
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="block w-full bg-[#F1F3ED] hover:bg-[#E5E7E0] text-[#171820] py-3.5 rounded-xl font-bold border border-[#E5E7E0] transition-all text-sm"
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
