import { NavLink, useLocation } from 'react-router-dom';
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
  { to: '/projects', icon: HiOutlineFolder, label: 'Projects' },
  { to: '/tasks', icon: HiOutlineClipboardList, label: 'Tasks' },
  { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
  { to: '/team', icon: HiOutlineUserGroup, label: 'Team' },
  { to: '/devops', icon: HiOutlineServer, label: 'DevOps' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar() {
  const { user, currentTenant, logout } = useAuthStore();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">SaaSify</span>
      </div>

      {/* Tenant Selector */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-dark-800/50 border border-dark-600/30 cursor-pointer hover:border-primary-500/30 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            {currentTenant?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{currentTenant?.name || 'Select Org'}</p>
            <p className="text-dark-300 text-xs">{currentTenant?.memberCount || 0} members</p>
          </div>
          <HiOutlineChevronDown className="text-dark-400 w-4 h-4 flex-shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink key={item.to} to={item.to}>
              <motion.div
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-green to-accent-cyan rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-dark-400 text-xs truncate">{user?.email || ''}</p>
          </div>
          <button 
            onClick={logout}
            title="Logout"
            className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors text-dark-400 hover:text-accent-red"
          >
            <HiOutlineLogout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
