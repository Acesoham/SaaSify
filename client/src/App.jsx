import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';

// ── Eagerly loaded (part of initial bundle — these are always needed) ─────────
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import InvitePage       from './pages/InvitePage';
import NotFoundPage     from './pages/NotFoundPage';

// ── Lazily loaded public pages ────────────────────────────────────────────────
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage         = lazy(() => import('./pages/TermsPage'));

// ── Lazily loaded protected pages (only fetched after login) ──────────────────
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage   = lazy(() => import('./pages/ProjectsPage'));
const TasksPage      = lazy(() => import('./pages/TasksPage'));
const AnalyticsPage  = lazy(() => import('./pages/AnalyticsPage'));
const TeamPage       = lazy(() => import('./pages/TeamPage'));
const DevOpsPage     = lazy(() => import('./pages/DevOpsPage'));
const SettingsPage   = lazy(() => import('./pages/SettingsPage'));

// ── Minimal loading fallback ──────────────────────────────────────────────────
function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#F8F9F5' }}
      aria-label="Loading page"
    >
      <div className="w-8 h-8 border-2 border-[#E5E7E0] border-t-[#C4F13B] rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { accessToken } = useAuthStore();
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public routes ───────────────────────────────────────── */}
          <Route path="/"               element={<LandingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms"          element={<TermsPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/invite/:token"  element={<InvitePage />} />

          {/* Auth routes (redirect to dashboard if already logged in) */}
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

          {/* ── Protected routes ────────────────────────────────────── */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects"  element={<ProjectsPage />} />
            <Route path="/tasks"     element={<TasksPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/team"      element={<TeamPage />} />
            <Route path="/devops"    element={<DevOpsPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
          </Route>

          {/* ── 404 catch-all ────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
