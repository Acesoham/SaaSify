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
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
        <p className="text-dark-400">Please wait while we complete your sign in.</p>
      </motion.div>
    </div>
  );
}
