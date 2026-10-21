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

  const styles = {
    success: 'bg-[#EDFCF3] border-[#287D48]/30 text-[#287D48]',
    error:   'bg-[#FEF2F2] border-[#C43D3D]/30 text-[#C43D3D]',
    info:    'bg-[#EFF5FF] border-[#3478B9]/30 text-[#3478B9]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${styles[type] || styles.info}`}
    >
      {type === 'success'
        ? <HiOutlineCheck className="w-4 h-4 flex-shrink-0" />
        : <HiOutlineX className="w-4 h-4 flex-shrink-0" />
      }
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <HiOutlineX className="w-3.5 h-3.5" />
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
        : { emailNotifications: true, pushNotifications: true, taskAssignments: true, projectUpdates: true };
    } catch {
      return { emailNotifications: true, pushNotifications: true, taskAssignments: true, projectUpdates: true };
    }
  };

  const [notifPrefs, setNotifPrefs] = useState(getStoredNotifPrefs);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (currentTenant?.name) setOrgName(currentTenant.name);
  }, [currentTenant]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
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

  const handleSaveChanges = async () => {
    if (!orgName.trim()) { showToast('Organization name cannot be empty', 'error'); return; }
    if (orgName.trim() === currentTenant?.name) { showToast('No changes to save', 'info'); return; }

    setSaving(true);
    try {
      const { data } = await api.put('/tenants/current', { name: orgName.trim() });
      setCurrentTenant(data.data);
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { showToast('Please enter an email address', 'error'); return; }

    setInviting(true);
    setInviteLink('');
    try {
      const { data } = await api.post('/auth/invite', { email: inviteEmail.trim(), role: inviteRole });
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
    if (inviteLink) fetchMembers();
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

  const handleNotifToggle = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('saasify_notif_prefs', JSON.stringify(updated));
      showToast(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} ${updated[key] ? 'enabled' : 'disabled'}`);
      return updated;
    });
  };

  const tabs = [
    { id: 'general',       label: 'General',       icon: HiOutlineOfficeBuilding },
    { id: 'members',       label: 'Members',        icon: HiOutlineUsers },
    { id: 'security',      label: 'Security',       icon: HiOutlineShieldCheck },
    { id: 'notifications', label: 'Notifications',  icon: HiOutlineMail },
  ];

  const notifItems = [
    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
    { key: 'pushNotifications',  label: 'Push Notifications',  desc: 'Browser push notifications' },
    { key: 'taskAssignments',    label: 'Task Assignments',    desc: 'When you are assigned to a task' },
    { key: 'projectUpdates',     label: 'Project Updates',     desc: 'Activity in your projects' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#171820]">Settings</h1>
        <p className="text-[#6B7068] text-sm mt-0.5">Manage your workspace preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white p-1 rounded-lg w-fit border border-[#E5E7E0]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#C4F13B] text-[#171820]'
                : 'text-[#6B7068] hover:text-[#171820] hover:bg-[#F1F3ED]'
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 max-w-xl shadow-[0_1px_3px_rgba(23,24,32,0.06)] space-y-5"
        >
          <h2 className="text-[#171820] font-semibold text-base">Organization Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input-field"
                placeholder="Enter organization name"
              />
            </div>
            <div>
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Slug</label>
              <input
                type="text"
                defaultValue={currentTenant?.slug || ''}
                className="input-field bg-[#F8F9F5] cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Plan</label>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#EFF9D4] text-[#171820]">
                  {currentTenant?.plan || 'free'}
                </span>
                <button className="text-[#3478B9] text-sm hover:underline">Upgrade</button>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSaveChanges}
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#171820]/30 border-t-[#171820] rounded-full animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </motion.button>
        </motion.div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 max-w-xl shadow-[0_1px_3px_rgba(23,24,32,0.06)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[#171820] font-semibold text-base">Team Members</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInviteModal(true)}
              className="btn-primary text-sm"
            >
              <HiOutlineUserAdd className="w-4 h-4" />
              Invite Member
            </motion.button>
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-7 h-7 border-2 border-[#C4F13B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-[#969A92]">
              <HiOutlineUsers className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No members found. Invite someone to get started!</p>
            </div>
          ) : (
            members.map((member) => {
              const memberUser = member.userId || {};
              const isCurrentUser = memberUser._id === user?._id;
              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9F5] border border-[#E5E7E0]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#EFF9D4] rounded-full flex items-center justify-center text-[#171820] text-xs font-bold">
                      {(memberUser.name || memberUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[#171820] text-sm font-medium">
                        {memberUser.name || 'Unknown'}
                        {isCurrentUser && <span className="text-[#969A92] text-xs ml-1">(You)</span>}
                      </p>
                      <p className="text-[#969A92] text-xs">{memberUser.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      member.role === 'admin'
                        ? 'bg-[#EFF9D4] text-[#171820]'
                        : member.role === 'viewer'
                        ? 'bg-[#F1F3ED] text-[#6B7068]'
                        : 'bg-[#EDFCF3] text-[#287D48]'
                    }`}>
                      {member.role}
                    </span>
                    {!isCurrentUser && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(memberUser._id)}
                        disabled={removingMemberId === memberUser._id}
                        className="p-1.5 rounded-lg text-[#969A92] hover:text-[#C43D3D] hover:bg-[#C43D3D]/10 transition-all disabled:opacity-40"
                        title="Remove member"
                      >
                        {removingMemberId === memberUser._id
                          ? <div className="w-3.5 h-3.5 border-2 border-[#C43D3D]/30 border-t-[#C43D3D] rounded-full animate-spin" />
                          : <HiOutlineTrash className="w-3.5 h-3.5" />}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'transparent' }}
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseInviteModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl border border-[#E5E7E0] shadow-[0_20px_60px_rgba(23,24,32,0.15)] p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[#171820] font-semibold text-base">Invite Team Member</h3>
                <button
                  onClick={handleCloseInviteModal}
                  className="text-[#969A92] hover:text-[#171820] transition-colors p-1 rounded-lg hover:bg-[#F1F3ED]"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field"
                    placeholder="colleague@company.com"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !inviteLink) handleInvite(); }}
                  />
                </div>
                <div>
                  <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Role</label>
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
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleInvite}
                  disabled={inviting}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#171820]/30 border-t-[#171820] rounded-full animate-spin" />
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
                <div className="space-y-3">
                  <div>
                    <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Share this link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="input-field flex-1 text-xs"
                        onClick={(e) => e.target.select()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                          linkCopied
                            ? 'bg-[#EDFCF3] text-[#287D48] border border-[#287D48]/30'
                            : 'btn-primary'
                        }`}
                      >
                        {linkCopied
                          ? <><HiOutlineCheck className="w-4 h-4" /> Copied!</>
                          : <><HiOutlineClipboardCopy className="w-4 h-4" /> Copy</>}
                      </motion.button>
                    </div>
                  </div>

                  {/* Share via */}
                  <div>
                    <label className="text-[#6B7068] text-xs font-semibold uppercase tracking-wider block mb-1.5">Share via</label>
                    <div className="flex gap-2">
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        href={`https://wa.me/?text=${encodeURIComponent(`Hey! You've been invited to join "${currentTenant?.name || 'our team'}" on SaaSify 🚀\n\nClick the link to join:\n${inviteLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 hover:bg-[#25D366]/20 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        href={`mailto:${inviteEmail}?subject=${encodeURIComponent(`You're invited to join "${currentTenant?.name || 'our team'}" on SaaSify`)}&body=${encodeURIComponent(`Hi,\n\nYou've been invited to join "${currentTenant?.name || 'our team'}" on SaaSify as a ${inviteRole}.\n\nClick the link below to accept the invitation:\n${inviteLink}\n\nSee you there!\n— ${user?.name || 'Your teammate'}`)}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[#EFF5FF] text-[#3478B9] border border-[#3478B9]/25 hover:bg-[#DEEEFF] transition-all"
                      >
                        <HiOutlineMail className="w-4 h-4" />
                        Email
                      </motion.a>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setInviteLink(''); setInviteEmail(''); setInviteRole('member'); }}
                    className="w-full btn-secondary justify-center"
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 max-w-xl shadow-[0_1px_3px_rgba(23,24,32,0.06)] space-y-4"
        >
          <h2 className="text-[#171820] font-semibold text-base">Security Settings</h2>
          <div className="space-y-2">
            {['Two-Factor Authentication', 'Session Management', 'API Key Management'].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F9F5] border border-[#E5E7E0]"
              >
                <span className="text-[#171820] text-sm">{item}</span>
                <button className="text-[#3478B9] text-sm font-medium hover:underline">Configure</button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-6 max-w-xl shadow-[0_1px_3px_rgba(23,24,32,0.06)] space-y-4"
        >
          <h2 className="text-[#171820] font-semibold text-base">Notification Preferences</h2>
          <div className="space-y-2">
            {notifItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F9F5] border border-[#E5E7E0]"
              >
                <div>
                  <span className="text-[#171820] text-sm block font-medium">{item.label}</span>
                  <span className="text-[#969A92] text-xs">{item.desc}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={() => handleNotifToggle(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#E5E7E0] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C4F13B]" />
                </label>
              </div>
            ))}
          </div>
          <p className="text-[#969A92] text-xs">Notification preferences are saved automatically.</p>
        </motion.div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
