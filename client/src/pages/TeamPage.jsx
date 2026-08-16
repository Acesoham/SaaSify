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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
          <p className="text-dark-300 mt-1">Manage your team members and their access levels</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setInviteLink('');
            setInviteEmail('');
            setShowInviteModal(true);
          }}
          className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
        >
          <HiOutlineUserAdd className="w-5 h-5" />
          Invite Member
        </motion.button>
      </div>

      {/* Members List */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-dark-900/50 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-dark-400">Member</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-dark-400">Role</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-dark-400">Status</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-dark-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {members.map((member, i) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={member._id} 
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                      {member.userId.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{member.userId.name}</p>
                      <p className="text-dark-400 text-xs">{member.userId.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    member.role === 'admin' ? 'bg-primary-500/10 text-primary-400' : 'bg-dark-800 text-dark-300'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-accent-green text-xs font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-green"></div>
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {member.userId._id !== user._id && (
                    <button 
                      onClick={() => removeMember(member.userId._id)}
                      className="p-2 text-dark-400 hover:text-accent-red transition-colors"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
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
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Invite team member</h2>
              <p className="text-dark-400 mb-6">Send an invitation link to collaborate on your projects.</p>

              {!inviteLink ? (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-dark-300 text-sm block mb-1.5">Email Address</label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 w-5 h-5" />
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="colleague@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-dark-300 text-sm block mb-1.5">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setInviteRole('member')}
                        className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                          inviteRole === 'member' 
                            ? 'bg-primary-500/10 border-primary-500/50 text-white' 
                            : 'bg-dark-900/50 border-white/5 text-dark-400 hover:border-white/10'
                        }`}
                      >
                        <HiOutlineShieldCheck className="w-6 h-6 mb-2" />
                        <span className="font-bold text-sm">Member</span>
                        <span className="text-[10px] opacity-60">Full access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInviteRole('admin')}
                        className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                          inviteRole === 'admin' 
                            ? 'bg-primary-500/10 border-primary-500/50 text-white' 
                            : 'bg-dark-900/50 border-white/5 text-dark-400 hover:border-white/10'
                        }`}
                      >
                        <motion.div animate={inviteRole === 'admin' ? { rotate: [0, 10, -10, 0] } : {}}>
                          <HiOutlineShieldCheck className="w-6 h-6 mb-2 text-primary-400" />
                        </motion.div>
                        <span className="font-bold text-sm">Admin</span>
                        <span className="text-[10px] opacity-60">Full control</span>
                      </button>
                    </div>
                  </div>

                  <motion.button
                    disabled={isInviting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold mt-4 shadow-lg shadow-primary-500/20 disabled:opacity-50"
                  >
                    {isInviting ? 'Generating Link...' : 'Generate Invite Link'}
                  </motion.button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-6 bg-accent-green/10 rounded-3xl border border-accent-green/20">
                    <HiOutlineCheckCircle className="w-12 h-12 text-accent-green mb-2" />
                    <p className="text-white font-bold">Invite link generated!</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-dark-300 text-sm">Share this link with your team member</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={inviteLink}
                        className="input-field flex-1 font-mono text-xs"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="p-3 bg-dark-800 rounded-xl hover:bg-dark-700 transition-all border border-white/5"
                      >
                        {copied ? <HiOutlineCheckCircle className="w-6 h-6 text-accent-green" /> : <HiOutlineLink className="w-6 h-6 text-white" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full border border-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/5 transition-all"
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
