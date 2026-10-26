import { useState, useEffect, useRef, useCallback } from 'react';
import { HiOutlineSearch, HiOutlineBell, HiOutlineX, HiOutlineCheck, HiOutlineCheckCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeConfig = {
  invite:        { icon: '🎉', color: 'bg-[#EFF9D4] text-[#287D48]' },
  task_assigned: { icon: '📋', color: 'bg-[#EFF5FF] text-[#3478B9]' },
  project_added: { icon: '📁', color: 'bg-[#F4EFFF] text-[#6B4DA0]' },
  general:       { icon: '🔔', color: 'bg-[#F8F9F5] text-[#6B7068]' },
};

export default function TopBar() {
  const { user, acceptInvite, fetchUser, tenants, currentTenant, setCurrentTenant } = useAuthStore();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accepting, setAccepting] = useState(null); // token being accepted
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // silently fail
    }
  }, []);

  // Poll every 30s when panel is closed; fetch immediately on open
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (showNotifs) fetchNotifications();
  }, [showNotifs, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((c) => {
      const n = notifications.find((x) => x._id === id);
      return n && !n.read ? Math.max(0, c - 1) : c;
    });
  };

  const handleAcceptInvite = async (notif) => {
    const token = notif.meta?.inviteToken;
    if (!token || accepting) return;
    setAccepting(token);
    try {
      await acceptInvite(token);
      await fetchUser(); // reload tenants
      // Mark notification as read & remove it
      await api.post(`/notifications/${notif._id}/read`).catch(() => {});
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
      setUnreadCount((c) => (!notif.read ? Math.max(0, c - 1) : c));
      setShowNotifs(false);
      navigate('/dashboard');
    } catch {
      // keep notification visible
    } finally {
      setAccepting(null);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-[#E5E7E0] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-full max-w-sm" role="search">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969A92] w-4 h-4" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search tasks, projects..."
          aria-label="Search tasks and projects"
          className="w-full bg-[#F8F9F5] border border-[#E5E7E0] rounded-lg pl-9 pr-4 py-2 text-sm text-[#171820] placeholder-[#969A92] focus:outline-none focus:ring-2 focus:ring-[#C4F13B]/40 focus:border-[#C4F13B] transition-all"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 ml-4">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-[#F1F3ED] transition-all"
            aria-label="Notifications"
          >
            <HiOutlineBell className="w-5 h-5 text-[#6B7068]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#C43D3D] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-[#E5E7E0] rounded-2xl shadow-[0_16px_48px_rgba(23,24,32,0.14)] overflow-hidden z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7E0]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[#171820] font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-[#C43D3D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#3478B9] hover:underline flex items-center gap-1"
                    >
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-[#F1F3ED]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-3xl mb-2">🔔</div>
                      <p className="text-[#969A92] text-sm">All caught up!</p>
                      <p className="text-[#969A92] text-xs mt-1">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const cfg = typeConfig[notif.type] || typeConfig.general;
                      const isInvite = notif.type === 'invite' && notif.meta?.inviteToken;
                      return (
                        <div
                          key={notif._id}
                          onClick={async () => {
                            if (!notif.read) await markRead(notif._id);
                            const isTaskNotification = notif.type === 'task_assigned' || Boolean(notif.meta?.taskId);
                            if (notif.type === 'project_added' || isTaskNotification) {
                              const destination = notif.type === 'project_added' ? '/projects' : '/tasks';
                              const targetTenant = tenants.find((entry) =>
                                String(entry.tenant?._id) === String(notif.meta?.tenantId)
                              )?.tenant;

                              setShowNotifs(false);
                              if (targetTenant && String(targetTenant._id) !== String(currentTenant?._id)) {
                                setCurrentTenant(targetTenant);
                                window.location.assign(destination);
                              } else if (isTaskNotification) {
                                window.location.assign(destination);
                              } else {
                                navigate(destination);
                              }
                            }
                          }}
                          className={`flex gap-3 px-4 py-3.5 transition-all ${
                            !notif.read ? 'bg-[#FAFFEE] hover:bg-[#F5FFDB]' : 'hover:bg-[#F8F9F5]'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${cfg.color}`}>
                            {cfg.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug mb-0.5 ${!notif.read ? 'font-semibold text-[#171820]' : 'text-[#171820]'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-[#6B7068] leading-relaxed line-clamp-2">{notif.message}</p>

                            {/* Invite actions */}
                            {isInvite && (
                              <div className="flex gap-1.5 mt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAcceptInvite(notif); }}
                                  disabled={accepting === notif.meta.inviteToken}
                                  className="flex items-center gap-1 px-3 py-1 bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                                >
                                  {accepting === notif.meta.inviteToken ? (
                                    <div className="w-3 h-3 border-2 border-[#171820]/30 border-t-[#171820] rounded-full animate-spin" />
                                  ) : (
                                    <HiOutlineCheck className="w-3 h-3" />
                                  )}
                                  Accept
                                </button>
                                <button
                                  onClick={(e) => deleteNotif(notif._id, e)}
                                  className="px-3 py-1 bg-[#F1F3ED] hover:bg-[#E5E7E0] text-[#6B7068] text-[10px] font-semibold rounded-lg transition-all"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            <p className="text-[10px] text-[#969A92] mt-1.5">{timeAgo(notif.createdAt)}</p>
                          </div>

                          {/* Unread dot + delete */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-[#C43D3D] mt-1" />
                            )}
                            <button
                              onClick={(e) => deleteNotif(notif._id, e)}
                              className="p-1 rounded-md hover:bg-[#F1F3ED] text-[#969A92] hover:text-[#C43D3D] transition-all opacity-0 group-hover:opacity-100"
                              title="Dismiss"
                            >
                              <HiOutlineX className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1F3ED] border border-[#E5E7E0]">
          <div className="w-6 h-6 rounded-full bg-[#C4F13B] flex items-center justify-center text-[10px] font-bold text-[#171820]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-[#171820] text-sm font-medium">{user?.name?.split(' ')[0] || 'User'}</span>
        </div>
      </div>
    </header>
  );
}
