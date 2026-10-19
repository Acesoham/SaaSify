import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFoundPage() {
  usePageMeta('Page Not Found', 'The page you are looking for could not be found.', true);
  const { accessToken } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#F8F9F5' }}>
      {/* Decorative blob */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(196,241,59,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2.5 mb-10" aria-label="SaaSify home">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#171820' }}>
            <span className="font-black text-sm" style={{ color: '#C4F13B' }}>S</span>
          </div>
          <span className="font-black text-xl text-[#171820]">SaaSify</span>
        </Link>

        {/* 404 number */}
        <div className="mb-6">
          <p
            className="font-black leading-none select-none"
            style={{ fontSize: 'clamp(80px, 20vw, 160px)', color: '#EFF9D4', letterSpacing: '-0.05em' }}
            aria-hidden="true"
          >
            404
          </p>
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-black text-[#171820] mb-3">
          Page not found
        </h1>
        <p className="text-[#6B7068] text-base max-w-sm mx-auto mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved. No secrets here — just an empty page.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={accessToken ? '/dashboard' : '/'}
            className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-all"
            style={{ backgroundColor: '#C4F13B', color: '#171820' }}
          >
            {accessToken ? 'Go to Dashboard' : 'Back to Home'}
          </Link>
          {accessToken && (
            <Link
              to="/projects"
              className="text-sm text-[#6B7068] hover:text-[#171820] transition-colors border border-[#E5E7E0] px-6 py-2.5 rounded-xl hover:bg-white"
            >
              View Projects
            </Link>
          )}
        </div>

        <p className="text-[#969A92] text-xs mt-8">
          HTTP 404 · SaaSify
        </p>
      </motion.div>
    </div>
  );
}
