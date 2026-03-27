import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineUsers, HiOutlineClipboardList, HiOutlineFolder } from 'react-icons/hi';
import { useProjectStore } from '../store/dataStore';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const colorOptions = ['#6C5CE7', '#00B894', '#E17055', '#74B9FF', '#FDCB6E', '#FD79A8', '#00CEC9'];

function ProjectCard({ project, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card-hover p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (project.color || '#6C5CE7') + '30' }}>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color || '#6C5CE7' }}></div>
        </div>
        <span className={`badge ${project.status === 'active' ? 'bg-accent-green/20 text-accent-green' : project.status === 'completed' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-dark-600/50 text-dark-300'}`}>
          {project.status || 'Active'}
        </span>
      </div>

      <h3 className="text-white font-semibold text-lg mb-1">{project.name}</h3>
      <p className="text-dark-400 text-sm mb-4 line-clamp-1">{project.description || 'No description'}</p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-dark-400 text-sm">Progress</span>
        <span className="text-white text-sm font-medium">{project.progress || 0}%</span>
      </div>
      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${project.progress || 0}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full"
          style={{ backgroundColor: project.color || '#6C5CE7' }}
        />
      </div>

      <div className="flex items-center gap-6 text-dark-400 text-sm">
        <div className="flex items-center gap-1.5">
          <HiOutlineClipboardList className="w-4 h-4" />
          <span className="text-dark-300 font-medium">Tasks</span>
          <span className="text-white font-semibold">{project.taskCount || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HiOutlineUsers className="w-4 h-4" />
          <span className="text-dark-300 font-medium">Members</span>
          <span className="text-white font-semibold">{project.members?.length || 0}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#6C5CE7' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-dark-300 mt-1">Manage and track all your projects</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, idx) => (
            <ProjectCard key={project._id} project={project} index={idx} />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projects.length * 0.08 }}
            onClick={() => setShowModal(true)}
            className="glass-card border-2 border-dashed border-dark-600/50 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/40 transition-all min-h-[240px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-dark-700/50 flex items-center justify-center mb-3">
              <HiOutlinePlus className="w-7 h-7 text-dark-400" />
            </div>
            <h3 className="text-white font-semibold">Create New Project</h3>
            <p className="text-dark-400 text-sm mt-1">Start a new project and invite your team</p>
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
    </div>
  );
}
