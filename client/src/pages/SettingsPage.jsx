import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineMail,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineUserAdd,
  HiOutlineTrash,
} from 'react-icons/hi';

// Toast notification component
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm ${
        type === 'success'
          ? 'bg-accent-green/15 border-accent-green/30 text-accent-green'
          : type === 'error'
          ? 'bg-accent-red/15 border-accent-red/30 text-accent-red'
          : 'bg-primary-500/15 border-primary-500/30 text-primary-300'
      }`}
    >
      {type === 'success' ? (
        <HiOutlineCheck className="w-5 h-5 flex-shrink-0" />
      ) : (
        <HiOutlineX className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <HiOutlineX className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { currentTenant, user, setCurrentTenant } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState(null);

  // === General Tab State ===
  const [orgName, setOrgName] = useState(currentTenant?.name || '');
  const [saving, setSaving] = useState(false);

  // === Members Tab State ===
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  // === Notifications Tab State ===
  const getStoredNotifPrefs = () => {
    try {
      const stored = localStorage.getItem('saasify_notif_prefs');
      return stored
        ? JSON.parse(stored)
        : {
            emailNotifications: true,
            pushNotifications: true,
            taskAssignments: true,
            projectUpdates: true,
          };
    } catch {
      return {
        emailNotifications: true,
        pushNotifications: true,
        taskAssignments: true,
        projectUpdates: true,
      };
    }
  };

  const [notifPrefs, setNotifPrefs] = useState(getStoredNotifPrefs);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Sync org name when tenant changes
  useEffect(() => {
    if (currentTenant?.name) {
      setOrgName(currentTenant.name);
    }
  }, [currentTenant]);

  // Fetch members when Members tab is active
  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data } = await api.get('/tenants/members');
      setMembers(data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  // === General: Save Changes ===
  const handleSaveChanges = async () => {
    if (!orgName.trim()) {
      showToast('Organization name cannot be empty', 'error');
      return;
    }
    if (orgName.trim() === currentTenant?.name) {
      showToast('No changes to save', 'info');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/tenants/current', { name: orgName.trim() });
      // Update local state
      setCurrentTenant(data.data);
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // === Members: Invite ===
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setInviting(true);
    setInviteLink('');
    try {
      const { data } = await api.post('/auth/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const link = data.data?.inviteLink || `${window.location.origin}/invite/${data.data?.inviteToken}`;
      setInviteLink(link);
      showToast('Invite link generated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      showToast('Invite link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      showToast('Invite link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('member');
    setInviteLink('');
    setLinkCopied(false);
    // Refresh members list
    if (inviteLink) {
      fetchMembers();
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setRemovingMemberId(userId);
    try {
      await api.delete(`/tenants/members/${userId}`);
      showToast('Member removed successfully');
      fetchMembers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // === Notifications: Toggle ===
  const handleNotifToggle = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('saasify_notif_prefs', JSON.stringify(updated));
      showToast(
        `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} ${
          updated[key] ? 'enabled' : 'disabled'
        }`
      );
      return updated;
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: HiOutlineOfficeBuilding },
    { id: 'members', label: 'Members', icon: HiOutlineUsers },
    { id: 'security', label: 'Security', icon: HiOutlineShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: HiOutlineMail },
  ];

  const notifItems = [
    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
    { key: 'taskAssignments', label: 'Task Assignments', desc: 'When you are assigned to a task' },
    { key: 'projectUpdates', label: 'Project Updates', desc: 'Activity in your projects' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-dark-300 mt-1">Manage your workspace preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-dark-800/50 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary-500/30 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 max-w-2xl space-y-6"
        >
          <h2 className="text-white font-semibold text-lg">Organization Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input-field"
                placeholder="Enter organization name"
              />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Slug</label>
              <input
                type="text"
                defaultValue={currentTenant?.slug || ''}
                className="input-field"
                disabled
              />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Plan</label>
              <div className="flex items-center gap-3">
                <span className="badge bg-primary-500/20 text-primary-300 text-sm">
                  {currentTenant?.plan || 'free'}
                </span>
                <button className="text-primary-400 text-sm hover:underline">Upgrade</button>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveChanges}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 max-w-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Team Members</h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowInviteModal(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <HiOutlineUserAdd className="w-4 h-4" />
              Invite Member
            </motion.button>
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <HiOutlineUsers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No members found. Invite someone to get started!</p>
            </div>
          ) : (
            members.map((member) => {
              const memberUser = member.userId || {};
              const isCurrentUser = memberUser._id === user?._id;
              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-600/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {(memberUser.name || memberUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {memberUser.name || 'Unknown'} {isCurrentUser && <span className="text-dark-400 text-xs">(You)</span>}
                      </p>
                      <p className="text-dark-400 text-xs">{memberUser.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        member.role === 'admin'
                          ? 'bg-primary-500/20 text-primary-300'
                          : member.role === 'viewer'
                          ? 'bg-dark-600/50 text-dark-300'
                          : 'bg-accent-green/20 text-accent-green'
                      }`}
                    >
                      {member.role}
                    </span>
                    {!isCurrentUser && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(memberUser._id)}
                        disabled={removingMemberId === memberUser._id}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-accent-red hover:bg-accent-red/10 transition-all disabled:opacity-40"
                        title="Remove member"
                      >
                        {removingMemberId === memberUser._id ? (
                          <div className="w-4 h-4 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin" />
                        ) : (
                          <HiOutlineTrash className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseInviteModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-6 w-full max-w-md border border-white/10 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Invite Team Member</h3>
                <button
                  onClick={handleCloseInviteModal}
                  className="text-dark-400 hover:text-white transition-colors p-1"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-dark-300 text-sm block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field"
                    placeholder="colleague@company.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !inviteLink) handleInvite();
                    }}
                  />
                </div>
                <div>
                  <label className="text-dark-300 text-sm block mb-1.5">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input-field"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              {!inviteLink ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInvite}
                  disabled={inviting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <HiOutlineUserAdd className="w-4 h-4" />
                      Generate Invite Link
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-dark-300 text-sm block mb-1.5">
                      Share this link with your team member
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="input-field flex-1 text-xs"
                        onClick={(e) => e.target.select()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all ${
                          linkCopied
                            ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                            : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <HiOutlineCheck className="w-4 h-4" /> Copied!
                          </>
                        ) : (
                          <>
                            <HiOutlineClipboardCopy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Share via WhatsApp & Email */}
                  <div>
                    <label className="text-dark-300 text-xs font-semibold uppercase tracking-wider block mb-2">
                      Share via
                    </label>
                    <div className="flex gap-2">
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Hey! You've been invited to join "${currentTenant?.name || 'our team'}" on SaaSify 🚀\n\nClick the link to join:\n${inviteLink}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25 hover:bg-[#25D366]/25 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={`mailto:${inviteEmail}?subject=${encodeURIComponent(
                          `You're invited to join "${currentTenant?.name || 'our team'}" on SaaSify`
                        )}&body=${encodeURIComponent(
                          `Hi,\n\nYou've been invited to join "${currentTenant?.name || 'our team'}" on SaaSify as a ${inviteRole}.\n\nClick the link below to accept the invitation:\n${inviteLink}\n\nSee you there!\n— ${user?.name || 'Your teammate'}`
                        )}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-primary-500/15 text-primary-300 border border-primary-500/25 hover:bg-primary-500/25 transition-all"
                      >
                        <HiOutlineMail className="w-4 h-4" />
                        Email
                      </motion.a>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setInviteLink('');
                      setInviteEmail('');
                      setInviteRole('member');
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-dark-300 bg-dark-800/60 border border-dark-600/30 hover:text-white hover:border-dark-500/50 transition-all"
                  >
                    Invite Another Member
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 max-w-2xl space-y-4"
        >
          <h2 className="text-white font-semibold text-lg">Security Settings</h2>
          <div className="space-y-3">
            {['Two-Factor Authentication', 'Session Management', 'API Key Management'].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-600/20"
              >
                <span className="text-white text-sm">{item}</span>
                <button className="text-primary-400 text-sm hover:underline">Configure</button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 max-w-2xl space-y-4"
        >
          <h2 className="text-white font-semibold text-lg">Notification Preferences</h2>
          <div className="space-y-3">
            {notifItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-600/20"
              >
                <div>
                  <span className="text-white text-sm block">{item.label}</span>
                  <span className="text-dark-400 text-xs">{item.desc}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={() => handleNotifToggle(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            ))}
          </div>

          <p className="text-dark-500 text-xs">
            Notification preferences are saved automatically.
          </p>
        </motion.div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
