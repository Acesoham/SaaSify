import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineUsers, HiOutlineClipboardList, HiOutlineFolder } from 'react-icons/hi';
import { useProjectStore } from '../store/dataStore';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const colorOptions = ['#6C5CE7', '#00B894', '#E17055', '#74B9FF', '#FDCB6E', '#FD79A8', '#00CEC9'];

function ProjectCard({ project, index, onManageMembers }) {
  const owner = project.owner || {};
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card-hover p-6 cursor-pointer flex flex-col h-full bg-dark-800/60 border border-white/5 hover:border-primary-500/30 transition-all shadow-xl shadow-black/10 group"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: (project.color || '#6C5CE7') + '20', border: `1px solid ${(project.color || '#6C5CE7')}30` }}>
          <div className="w-5 h-5 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.3)]" style={{ backgroundColor: project.color || '#6C5CE7' }}></div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${project.status === 'active' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : project.status === 'completed' ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' : 'bg-dark-700 text-dark-400 border border-dark-600/50'}`}>
            {project.status || 'Active'}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onManageMembers(project); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-400 hover:text-primary-300 text-[10px] font-bold flex items-center gap-1"
          >
            <HiOutlineUsers className="w-3.5 h-3.5" /> Manage Team
          </button>
        </div>
      </div>

      <h3 className="text-white font-bold text-xl mb-1.5 leading-tight tracking-tight">{project.name}</h3>
      <p className="text-dark-400 text-xs mb-6 line-clamp-2 leading-relaxed">{project.description || 'Elevate your workflow with professional project management.'}</p>

      <div className="mt-auto space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-dark-400 text-[10px] font-black uppercase tracking-wider">Progress</span>
            <span className="text-white text-xs font-black">{project.progress || 0}%</span>
          </div>
          <div className="w-full h-2 bg-dark-900/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress || 0}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
              style={{ backgroundColor: project.color || '#6C5CE7' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex -space-x-2">
            {(project.members || []).slice(0, 4).map((member, i) => (
              <div key={i} title={member.name} className="w-7 h-7 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-[10px] text-white font-black overflow-hidden shadow-sm ring-1 ring-white/5">
                {member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> : (member.name?.charAt(0) || '?')}
              </div>
            ))}
            {project.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-dark-800 border-2 border-dark-800 flex items-center justify-center text-[8px] text-dark-400 font-black shadow-sm ring-1 ring-white/5">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-dark-400 text-[10px] font-black uppercase tracking-tight">
            <div className="flex items-center gap-1.5">
              <HiOutlineClipboardList className="w-3.5 h-3.5 text-primary-500" />
              <span>{project.taskCount || 0} Tasks</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { projects, tenantMembers, fetchProjects, createProject, updateProject, fetchTenantMembers, isLoading } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#6C5CE7' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTenantMembers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setCreating(true);
    try {
      await createProject(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', color: '#6C5CE7' });
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleManageMembers = (project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
  };

  const toggleMember = async (userId) => {
    const isMember = selectedProject.members.some(m => m._id === userId);
    let newMembers;
    
    if (isMember) {
      newMembers = selectedProject.members.filter(m => m._id !== userId).map(m => m._id);
    } else {
      newMembers = [...selectedProject.members.map(m => m._id), userId];
    }

    try {
      const updated = await updateProject(selectedProject._id, { members: newMembers });
      setSelectedProject(updated);
    } catch (err) {
      console.error('Failed to update project members:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Projects</h1>
          <p className="text-dark-400 text-sm mt-1">Manage and track your high-impact initiatives</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Project
        </motion.button>
      </div>

      {projects.length === 0 && !isLoading ? (
        <EmptyState
          icon={HiOutlineFolder}
          title="No projects yet"
          description="Create your first project to start organizing tasks and collaborating with your team."
          actionLabel="+ Create Project"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {projects.map((project, idx) => (
            <ProjectCard key={project._id} project={project} index={idx} onManageMembers={handleManageMembers} />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projects.length * 0.08 }}
            onClick={() => setShowModal(true)}
            className="glass-card border-2 border-dashed border-dark-600/40 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/50 hover:bg-dark-800/20 transition-all min-h-[220px] rounded-3xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-dark-800/50 flex items-center justify-center mb-4 border border-white/5">
              <HiOutlinePlus className="w-6 h-6 text-dark-400" />
            </div>
            <h3 className="text-white font-black tracking-tight">Create New Project</h3>
            <p className="text-dark-400 text-[10px] font-bold uppercase tracking-wider mt-1">New Initiative</p>
          </motion.div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-dark-300 text-sm block mb-1.5">Project Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="input-field"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-dark-300 text-sm block mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the project"
              className="input-field min-h-[80px] resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-dark-300 text-sm block mb-2">Color</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-lg transition-all ${formData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost border border-dark-600/40 rounded-xl text-center justify-center">
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={creating || !formData.name.trim()}
              className="flex-1 btn-primary justify-center disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal 
        isOpen={showMembersModal} 
        onClose={() => setShowMembersModal(false)} 
        title={`Manage Team - ${selectedProject?.name}`}
        size="md"
      >
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search team members..." 
              className="input-field pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
              <HiOutlineUsers className="w-4 h-4" />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {tenantMembers.map((membership) => {
              const u = membership.userId;
              const isMember = selectedProject?.members.some(m => m._id === u._id);
              
              return (
                <div 
                  key={u._id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isMember ? 'bg-primary-500/10 border-primary-500/30' : 'bg-dark-800/40 border-white/5 hover:border-dark-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center text-xs font-black text-white overflow-hidden shadow-sm">
                      {u.avatar ? <img src={u.avatar} alt={u.name} /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold leading-tight">{u.name}</p>
                      <p className="text-dark-400 text-[10px] uppercase font-black tracking-widest">{membership.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMember(u._id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${isMember ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'}`}
                  >
                    {isMember ? 'Remove' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-dark-500 text-[10px] font-bold uppercase tracking-widest text-center">
              Team members can view and interact with all project tasks
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
