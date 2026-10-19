import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    const handleCallback = async () => {
      if (accessToken && refreshToken) {
        // Save token correctly so api.js uses it
        useAuthStore.getState().setAccessToken(accessToken);

        // Refresh the user context
        await fetchUser();
        navigate('/dashboard', { replace: true });
      } else {
        // Fallback if tokens are missing
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9F5' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-14 h-14 border-4 border-[#E5E7E0] border-t-[#C4F13B] rounded-full animate-spin mx-auto mb-5" />
        <h2 className="text-xl font-semibold text-[#171820] mb-1.5">Authenticating…</h2>
        <p className="text-[#6B7068] text-sm">Please wait while we complete your sign in.</p>
      </motion.div>
    </div>
  );
}
