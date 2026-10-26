import { NavLink, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
  const { user, currentTenant, tenants, setCurrentTenant, logout } = useAuthStore();
  const location = useLocation();
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const tenantEntries = (tenants || []).filter((entry) => entry.tenant);

  const selectTenant = (tenant) => {
    setCurrentTenant(tenant);
    setTenantMenuOpen(false);
    if (tenant._id !== currentTenant?._id) window.location.reload();
  };

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
      <div className="relative mx-4 mb-5">
        <button
          type="button"
          aria-label="Switch workspace"
          aria-expanded={tenantMenuOpen}
          disabled={tenantEntries.length < 2}
          onClick={() => setTenantMenuOpen((open) => !open)}
          className="w-full p-3 rounded-xl text-left transition-all disabled:cursor-default"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
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
        </button>
        {tenantMenuOpen && tenantEntries.length > 1 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-[#2E3038] bg-[#20212A] p-1 shadow-xl">
            {tenantEntries.map(({ tenant, role }) => (
              <button
                key={tenant._id}
                type="button"
                onClick={() => selectTenant(tenant)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${tenant._id === currentTenant?._id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className="block truncate text-sm font-medium text-white">{tenant.name}</span>
                <span className="block text-xs capitalize text-[#969A92]">{role} · {tenant.memberCount || 0} members</span>
              </button>
            ))}
          </div>
        )}
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
