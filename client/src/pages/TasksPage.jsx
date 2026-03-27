import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineFilter, HiOutlineViewGrid, HiOutlineViewList, HiOutlineCalendar, HiOutlineClipboardList } from 'react-icons/hi';
import { useTaskStore, useProjectStore } from '../store/dataStore';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const priorityConfig = {
  low: { label: 'low', class: 'badge-low', dot: 'bg-dark-400' },
  medium: { label: 'medium', class: 'badge-medium', dot: 'bg-accent-blue' },
  high: { label: 'high', class: 'badge-high', dot: 'bg-accent-orange' },
  urgent: { label: 'urgent', class: 'badge-urgent', dot: 'bg-accent-red' },
};

const columnConfig = {
  backlog: { label: 'Backlog', dot: 'bg-dark-400' },
  todo: { label: 'To Do', dot: 'bg-accent-orange' },
  'in-progress': { label: 'In Progress', dot: 'bg-accent-blue' },
  review: { label: 'Review', dot: 'bg-accent-yellow' },
  done: { label: 'Done', dot: 'bg-accent-green' },
};

function TaskCard({ task, index }) {
  const p = priorityConfig[task.priority] || priorityConfig.medium;
  const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-dark-800/80 border border-dark-600/30 rounded-xl p-4 cursor-pointer hover:border-primary-500/30 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${p.dot}`}></div>
        <span className={p.class}>{p.label}</span>
      </div>

      <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>
      <p className="text-dark-400 text-xs mb-3 line-clamp-2">{task.description}</p>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag) => (
            <span key={tag} className="text-xs bg-dark-700/60 text-dark-200 px-2 py-0.5 rounded-md">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-2">
          {(task.assignees || []).slice(0, 3).map((a, i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-dark-800 flex items-center justify-center text-[10px] text-white font-bold">
              {a.name?.charAt(0) || '?'}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-dark-400 text-xs">
          {task.commentCount > 0 && <span>💬 {task.commentCount}</span>}
          {deadlineStr && <span>📅 {deadlineStr}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ status, tasks, onAddTask }) {
  const col = columnConfig[status] || columnConfig.todo;

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></div>
          <h3 className="text-white font-semibold text-sm">{col.label}</h3>
          <span className="bg-dark-700/50 text-dark-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAddTask(status)} className="text-dark-400 hover:text-white transition-colors">
          <HiOutlinePlus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <TaskCard key={task._id} task={task} index={idx} />
        ))}
        {tasks.length === 0 && (
          <div className="border border-dashed border-dark-600/40 rounded-xl p-4 text-center">
            <p className="text-dark-500 text-xs">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { kanban, fetchKanban, createTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const [view, setView] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', projectId: '', tags: '',
  });

  useEffect(() => {
    fetchKanban();
    fetchProjects();
  }, []);

  const hasAnyTasks = Object.values(kanban).some((col) => col.length > 0);

  const handleAddTask = (status) => {
    setFormData({ ...formData, status });
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) return;
    setCreating(true);
    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await createTask(taskData);
      setShowModal(false);
      setFormData({ title: '', description: '', status: 'todo', priority: 'medium', projectId: '', tags: '' });
      fetchKanban(); // refresh kanban
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-dark-300 mt-1">Manage your team's work and deliverables</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost flex items-center gap-2 border border-dark-600/40 rounded-lg">
            <HiOutlineFilter className="w-4 h-4" /> Filter
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Task
          </motion.button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-dark-800/50 p-1 rounded-xl w-fit">
        {[
          { id: 'kanban', icon: HiOutlineViewGrid, label: 'Kanban' },
          { id: 'list', icon: HiOutlineViewList, label: 'List' },
          { id: 'calendar', icon: HiOutlineCalendar, label: 'Calendar' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v.id ? 'bg-primary-500/30 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!hasAnyTasks ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title="No tasks yet"
          description={projects.length === 0 ? 'Create a project first, then add tasks to it.' : 'Start adding tasks to your projects to organize your workflow.'}
          actionLabel={projects.length > 0 ? '+ Create Task' : '+ Create a Project First'}
          onAction={() => {
            if (projects.length > 0) setShowModal(true);
            else window.location.href = '/projects';
          }}
        />
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {Object.entries(kanban).map(([status, tasks]) => (
            <KanbanColumn key={status} status={status} tasks={tasks} onAddTask={handleAddTask} />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Task" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-dark-300 text-sm block mb-1.5">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implement authentication"
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
              placeholder="Brief description of the task"
              className="input-field min-h-[70px] resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                {Object.entries(columnConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-dark-300 text-sm block mb-1.5">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="frontend, bug (comma-separated)"
                className="input-field"
              />
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
              disabled={creating || !formData.title.trim() || !formData.projectId}
              className="flex-1 btn-primary justify-center disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Task'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
