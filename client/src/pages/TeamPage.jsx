import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUserAdd, HiOutlineMail, HiOutlineShieldCheck, HiOutlineTrash, HiOutlineLink, HiOutlineCheckCircle } from 'react-icons/hi';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function TeamPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/tenants/members');
      setMembers(data.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const { data } = await api.post('/auth/invite', { email: inviteEmail, role: inviteRole });
      setInviteLink(data.data.inviteLink);
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/tenants/members/${userId}`);
      setMembers(members.filter(m => m.userId._id !== userId));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171820]">Team Management</h1>
          <p className="text-[#6B7068] text-sm mt-0.5">Manage your team members and their access levels</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setInviteLink('');
            setInviteEmail('');
            setShowInviteModal(true);
          }}
          className="btn-primary"
        >
          <HiOutlineUserAdd className="w-4 h-4" />
          Invite Member
        </motion.button>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#E5E7E0] rounded-xl shadow-[0_1px_3px_rgba(23,24,32,0.06)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F8F9F5] border-b border-[#E5E7E0]">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B7068]">Member</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B7068]">Role</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B7068]">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B7068] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F3ED]">
            {members.map((member, i) => (
              <motion.tr
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={member._id}
                className="hover:bg-[#F8F9F5] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EFF9D4] flex items-center justify-center text-[#171820] font-bold text-sm">
                      {member.userId.name[0]}
                    </div>
                    <div>
                      <p className="text-[#171820] font-medium text-sm">{member.userId.name}</p>
                      <p className="text-[#969A92] text-xs">{member.userId.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    member.role === 'admin'
                      ? 'bg-[#EFF9D4] text-[#171820]'
                      : 'bg-[#F1F3ED] text-[#6B7068]'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-1.5 text-[#287D48] text-xs font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#287D48]" />
                    Active
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {member.userId._id !== user._id && (
                    <button
                      onClick={() => removeMember(member.userId._id)}
                      className="p-1.5 text-[#969A92] hover:text-[#C43D3D] hover:bg-[#C43D3D]/10 rounded-lg transition-all"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && !loading && (
          <div className="text-center py-12 text-[#969A92]">
            <HiOutlineUserAdd className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No members found. Invite someone to get started!</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(23,24,32,0.45)', backdropFilter: 'blur(4px)' }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_20px_60px_rgba(23,24,32,0.15)] border border-[#E5E7E0] p-6"
            >
              <h2 className="text-xl font-bold text-[#171820] mb-1">Invite team member</h2>
              <p className="text-[#6B7068] text-sm mb-5">Send an invitation link to collaborate on your projects.</p>

              {!inviteLink ? (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Email Address</label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969A92] w-4 h-4" />
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="input-field pl-9"
                        placeholder="colleague@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#6B7068] text-sm block mb-2 font-medium">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setInviteRole('member')}
                        className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                          inviteRole === 'member'
                            ? 'bg-[#EFF9D4] border-[#C4F13B] text-[#171820]'
                            : 'bg-white border-[#E5E7E0] text-[#6B7068] hover:border-[#C4F13B]/40'
                        }`}
                      >
                        <HiOutlineShieldCheck className="w-5 h-5 mb-1.5" />
                        <span className="font-semibold text-sm">Member</span>
                        <span className="text-[10px] opacity-60">Full access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInviteRole('admin')}
                        className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                          inviteRole === 'admin'
                            ? 'bg-[#EFF9D4] border-[#C4F13B] text-[#171820]'
                            : 'bg-white border-[#E5E7E0] text-[#6B7068] hover:border-[#C4F13B]/40'
                        }`}
                      >
                        <HiOutlineShieldCheck className="w-5 h-5 mb-1.5" />
                        <span className="font-semibold text-sm">Admin</span>
                        <span className="text-[10px] opacity-60">Full control</span>
                      </button>
                    </div>
                  </div>

                  <motion.button
                    disabled={isInviting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full btn-primary justify-center disabled:opacity-50"
                  >
                    {isInviting ? 'Generating Link...' : 'Generate Invite Link'}
                  </motion.button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-5 bg-[#EDFCF3] rounded-xl border border-[#287D48]/20">
                    <HiOutlineCheckCircle className="w-10 h-10 text-[#287D48] mb-2" />
                    <p className="text-[#171820] font-semibold">Invite link generated!</p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[#6B7068] text-sm">Share this link with your team member</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={inviteLink}
                        className="input-field flex-1 font-mono text-xs"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="p-2.5 bg-[#F1F3ED] rounded-lg hover:bg-[#E5E7E0] transition-all border border-[#E5E7E0]"
                      >
                        {copied
                          ? <HiOutlineCheckCircle className="w-5 h-5 text-[#287D48]" />
                          : <HiOutlineLink className="w-5 h-5 text-[#6B7068]" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full btn-secondary justify-center"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
