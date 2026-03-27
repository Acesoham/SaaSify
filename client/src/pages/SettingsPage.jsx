import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { HiOutlineOfficeBuilding, HiOutlineUsers, HiOutlineShieldCheck, HiOutlineMail } from 'react-icons/hi';

export default function SettingsPage() {
  const { currentTenant, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: HiOutlineOfficeBuilding },
    { id: 'members', label: 'Members', icon: HiOutlineUsers },
    { id: 'security', label: 'Security', icon: HiOutlineShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: HiOutlineMail },
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 max-w-2xl space-y-6">
          <h2 className="text-white font-semibold text-lg">Organization Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Organization Name</label>
              <input type="text" defaultValue={currentTenant?.name || 'Acme Corporation'} className="input-field" />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Slug</label>
              <input type="text" defaultValue={currentTenant?.slug || 'acme-corporation'} className="input-field" disabled />
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Plan</label>
              <div className="flex items-center gap-3">
                <span className="badge bg-primary-500/20 text-primary-300 text-sm">{currentTenant?.plan || 'Pro'}</span>
                <button className="text-primary-400 text-sm hover:underline">Upgrade</button>
              </div>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary">
            Save Changes
          </motion.button>
        </motion.div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Team Members</h2>
            <button className="btn-primary text-sm">Invite Member</button>
          </div>

          {[
            { name: 'Sarah Chen', email: 'sarah@acme.com', role: 'Admin' },
            { name: 'James Wilson', email: 'james@acme.com', role: 'Member' },
            { name: 'Emma Rodriguez', email: 'emma@acme.com', role: 'Member' },
            { name: 'Michael Park', email: 'michael@acme.com', role: 'Viewer' },
          ].map((member) => (
            <div key={member.email} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-600/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{member.name}</p>
                  <p className="text-dark-400 text-xs">{member.email}</p>
                </div>
              </div>
              <span className={`badge ${member.role === 'Admin' ? 'bg-primary-500/20 text-primary-300' : member.role === 'Viewer' ? 'bg-dark-600/50 text-dark-300' : 'bg-accent-green/20 text-accent-green'}`}>
                {member.role}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 max-w-2xl space-y-4">
          <h2 className="text-white font-semibold text-lg">Security Settings</h2>
          <div className="space-y-3">
            {['Two-Factor Authentication', 'Session Management', 'API Key Management'].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-600/20">
                <span className="text-white text-sm">{item}</span>
                <button className="text-primary-400 text-sm hover:underline">Configure</button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 max-w-2xl space-y-4">
          <h2 className="text-white font-semibold text-lg">Notification Preferences</h2>
          <div className="space-y-3">
            {['Email Notifications', 'Push Notifications', 'Task Assignments', 'Project Updates'].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-600/20">
                <span className="text-white text-sm">{item}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
