import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineUsers, HiOutlineClipboardList, HiOutlineFolder } from 'react-icons/hi';
import { useProjectStore } from '../store/dataStore';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const colorOptions = ['#C4F13B', '#287D48', '#3478B9', '#A96612', '#C43D3D', '#6B7068', '#9B59B6'];

function ProjectCard({ project, index, onManageMembers }) {
  const owner = project.owner || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white border border-[#E5E7E0] rounded-xl p-5 cursor-pointer flex flex-col h-full group
                 hover:shadow-[0_4px_12px_rgba(23,24,32,0.09)] hover:border-[#C4F13B]/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: (project.color || '#C4F13B') + '18', border: `1.5px solid ${(project.color || '#C4F13B')}40` }}
        >
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color || '#C4F13B' }} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${
            project.status === 'active'
              ? 'bg-[#287D48]/10 text-[#287D48]'
              : project.status === 'completed'
              ? 'bg-[#3478B9]/10 text-[#3478B9]'
              : 'bg-[#F1F3ED] text-[#6B7068]'
          }`}>
            {project.status || 'Active'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onManageMembers(project); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C4F13B] hover:text-[#B3DF30] text-[10px] font-semibold flex items-center gap-1"
          >
            <HiOutlineUsers className="w-3 h-3" /> Manage Team
          </button>
        </div>
      </div>

      <h3 className="text-[#171820] font-semibold text-base mb-1 leading-tight">{project.name}</h3>
      <p className="text-[#6B7068] text-xs mb-5 line-clamp-2 leading-relaxed">
        {project.description || 'Track and manage all tasks for this project.'}
      </p>

      <div className="mt-auto space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#969A92] text-[10px] font-semibold uppercase tracking-wide">Progress</span>
            <span className="text-[#171820] text-xs font-semibold">{project.progress || 0}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#F1F3ED] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full"
              style={{ backgroundColor: project.color || '#C4F13B' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F1F3ED]">
          <div className="flex -space-x-2">
            {(project.members || []).slice(0, 4).map((member, i) => (
              <div
                key={i}
                title={member.name}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-[#171820] font-bold overflow-hidden bg-[#EFF9D4]"
              >
                {member.avatar
                  ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  : (member.name?.charAt(0) || '?')}
              </div>
            ))}
            {project.members?.length > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-[#F1F3ED] flex items-center justify-center text-[9px] text-[#6B7068] font-semibold">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[#6B7068] text-[10px] font-medium">
            <HiOutlineClipboardList className="w-3.5 h-3.5 text-[#C4F13B]" />
            <span>{project.taskCount || 0} Tasks</span>
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
  const [formData, setFormData] = useState({ name: '', description: '', color: '#C4F13B' });
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
      setFormData({ name: '', description: '', color: '#C4F13B' });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171820]">Projects</h1>
          <p className="text-[#6B7068] text-sm mt-0.5">Manage and track your high-impact initiatives</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <HiOutlinePlus className="w-4 h-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {projects.map((project, idx) => (
            <ProjectCard key={project._id} project={project} index={idx} onManageMembers={handleManageMembers} />
          ))}

          {/* Add card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projects.length * 0.06 }}
            onClick={() => setShowModal(true)}
            className="bg-white border-2 border-dashed border-[#E5E7E0] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#C4F13B]/60 hover:bg-[#EFF9D4]/20 transition-all min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F3ED] flex items-center justify-center mb-3">
              <HiOutlinePlus className="w-5 h-5 text-[#969A92]" />
            </div>
            <h3 className="text-[#171820] font-semibold text-sm">Create New Project</h3>
            <p className="text-[#969A92] text-xs mt-1">New Initiative</p>
          </motion.div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Project Name *</label>
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
            <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the project"
              className="input-field min-h-[80px] resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-[#6B7068] text-sm block mb-2 font-medium">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-7 h-7 rounded-lg transition-all ${formData.color === c ? 'ring-2 ring-[#171820] ring-offset-2 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 btn-secondary justify-center"
            >
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
        title={`Manage Team — ${selectedProject?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search team members..."
              className="input-field pl-9"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969A92]">
              <HiOutlineUsers className="w-4 h-4" />
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {tenantMembers.map((membership) => {
              const u = membership.userId;
              const isMember = selectedProject?.members.some(m => m._id === u._id);

              return (
                <div
                  key={u._id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isMember
                      ? 'bg-[#EFF9D4] border-[#C4F13B]/50'
                      : 'bg-white border-[#E5E7E0] hover:border-[#C4F13B]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F1F3ED] flex items-center justify-center text-xs font-bold text-[#171820] overflow-hidden">
                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[#171820] text-sm font-medium">{u.name}</p>
                      <p className="text-[#969A92] text-xs capitalize">{membership.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMember(u._id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isMember
                        ? 'bg-white text-[#6B7068] border border-[#E5E7E0] hover:text-[#C43D3D] hover:border-[#C43D3D]/30'
                        : 'bg-[#C4F13B] text-[#171820] hover:bg-[#B3DF30]'
                    }`}
                  >
                    {isMember ? 'Remove' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E5E7E0]">
            <p className="text-[#969A92] text-xs text-center">
              Team members can view and interact with all project tasks
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
