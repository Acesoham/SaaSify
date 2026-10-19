import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  HiOutlineViewGrid,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineServer,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlineChevronDown,
  HiOutlineLogout,
} from 'react-icons/hi';

const navItems = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/projects',  icon: HiOutlineFolder,        label: 'Projects' },
  { to: '/tasks',     icon: HiOutlineClipboardList,  label: 'Tasks' },
  { to: '/analytics', icon: HiOutlineChartBar,       label: 'Analytics' },
  { to: '/team',      icon: HiOutlineUserGroup,      label: 'Team' },
  { to: '/devops',    icon: HiOutlineServer,         label: 'DevOps' },
  { to: '/settings',  icon: HiOutlineCog,            label: 'Settings' },
];

export default function Sidebar() {
  const { user, currentTenant, logout } = useAuthStore();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-40"
           style={{ backgroundColor: '#171820' }}>

      {/* Logo — navigates to landing page */}
      <Link to="/" className="px-5 py-5 flex items-center gap-2.5" aria-label="SaaSify home">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: '#C4F13B' }}>
          <span className="font-black text-sm" style={{ color: '#171820' }}>S</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">SaaSify</span>
      </Link>

      {/* Tenant Selector */}
      <div className="mx-4 mb-5 p-3 rounded-xl cursor-pointer transition-all"
           style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
               style={{ backgroundColor: '#C4F13B', color: '#171820' }}>
            {currentTenant?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {currentTenant?.name || 'Select Org'}
            </p>
            <p className="text-xs" style={{ color: '#969A92' }}>
              {currentTenant?.memberCount || 0} members
            </p>
          </div>
          <HiOutlineChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#969A92' }} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5" aria-label="Main navigation">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2"
           style={{ color: '#4A4D45' }}>
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/');
          return (
            <NavLink key={item.to} to={item.to}>
              <motion.div
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                whileHover={{ x: isActive ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
               style={{ backgroundColor: '#C4F13B', color: '#171820' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: '#969A92' }}>
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out of SaaSify"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#969A92' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C43D3D'; e.currentTarget.style.backgroundColor = 'rgba(196,61,61,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#969A92'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <HiOutlineLogout className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
