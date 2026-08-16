import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { HiOutlinePlus, HiOutlineFilter, HiOutlineViewGrid, HiOutlineViewList, HiOutlineCalendar, HiOutlineClipboardList } from 'react-icons/hi';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

import { useTaskStore, useProjectStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import socketService from '../services/socket';
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

function TaskCard({ task, index, isOverlay, ...props }) {
  const p = priorityConfig[task.priority] || priorityConfig.medium;
  const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <motion.div
      initial={!isOverlay ? { opacity: 0, y: 10 } : {}}
      animate={!isOverlay ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.05 }}
      whileHover={!isOverlay ? { y: -2, scale: 1.01 } : {}}
      className={`bg-dark-800/90 border border-dark-600/40 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary-500/40 transition-all ${isOverlay ? 'shadow-2xl shadow-primary-500/20 scale-105 opacity-90' : 'shadow-sm shadow-black/20'}`}
      {...props}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${p.dot} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}></div>
        <span className={`${p.class} text-[10px] font-bold uppercase tracking-wider`}>{p.label}</span>
      </div>

      <h4 className="text-white font-semibold text-sm mb-1.5 line-clamp-2 leading-snug">{task.title}</h4>
      <p className="text-dark-400 text-xs mb-4 line-clamp-2 leading-relaxed">{task.description}</p>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium bg-dark-700/80 text-dark-200 px-2 py-0.5 rounded-md border border-white/5">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
        <div className="flex -space-x-2">
          {(task.assignees || []).slice(0, 3).map((a, i) => (
            <div key={i} title={a.name} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-dark-800 flex items-center justify-center text-[10px] text-white font-black overflow-hidden shadow-sm">
              {a.avatar ? <img src={a.avatar} alt={a.name} /> : (a.name?.charAt(0) || '?')}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-dark-400 text-[10px] font-medium">
          {task.commentCount > 0 && <span className="flex items-center gap-1">💬 {task.commentCount}</span>}
          {deadlineStr && <span className="flex items-center gap-1">📅 {deadlineStr}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function SortableTaskCard({ task, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-dark-800/20 border-2 border-dashed border-primary-500/20 rounded-xl h-32 w-full"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} index={index} />
    </div>
  );
}

function KanbanColumn({ status, tasks, onAddTask }) {
  const col = columnConfig[status] || columnConfig.todo;

  return (
    <div className="flex-1 min-w-[300px] flex flex-col h-full bg-dark-900/30 rounded-2xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${col.dot} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}></div>
          <h3 className="text-white font-bold text-sm tracking-tight">{col.label}</h3>
          <span className="bg-dark-800/80 text-dark-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/5">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAddTask(status)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-all">
          <HiOutlinePlus className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 min-h-[500px]">
        <SortableContext
          id={status}
          items={tasks.map(t => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, idx) => (
            <SortableTaskCard key={task._id} task={task} index={idx} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-dark-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-dark-950/20">
            <div className="w-10 h-10 rounded-full bg-dark-800/50 flex items-center justify-center mb-2">
              <HiOutlineClipboardList className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-dark-500 text-[11px] font-medium">No tasks in {col.label.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { kanban, fetchKanban, createTask, moveTask, setKanban } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { accessToken, currentTenant } = useAuthStore();
  const [activeTask, setActiveTask] = useState(null);
  const [view, setView] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', projectId: '', tags: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProjects();
    fetchKanban(selectedProjectId);

    // Socket Setup
    if (accessToken && currentTenant) {
      socketService.connect(accessToken);
      socketService.joinTenant(currentTenant._id);

      socketService.on('task:moved', (data) => {
        if (!selectedProjectId || data.projectId === selectedProjectId) {
          fetchKanban(selectedProjectId);
        }
      });

      socketService.on('task:created', () => fetchKanban(selectedProjectId));
      socketService.on('task:updated', () => fetchKanban(selectedProjectId));
      socketService.on('task:deleted', () => fetchKanban(selectedProjectId));
    }

    return () => {
      socketService.off('task:moved');
      socketService.off('task:created');
      socketService.off('task:updated');
      socketService.off('task:deleted');
    };
  }, [selectedProjectId, accessToken, currentTenant]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = Object.values(kanban).flat().find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCol = findColumn(activeId);
    const overCol = overId in kanban ? overId : findColumn(overId);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setKanban(prev => {
      const activeItems = [...prev[activeCol]];
      const overItems = [...prev[overCol]];

      const activeIndex = activeItems.findIndex(i => i._id === activeId);
      const overIndex = overId in prev ? overItems.length : overItems.findIndex(i => i._id === overId);

      const [movedItem] = activeItems.splice(activeIndex, 1);
      const updatedItem = { ...movedItem, status: overCol };
      overItems.splice(overIndex, 0, updatedItem);

      return {
        ...prev,
        [activeCol]: activeItems,
        [overCol]: overItems,
      };
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCol = findColumn(activeId);
    const overCol = overId in kanban ? overId : findColumn(overId);

    if (!activeCol || !overCol) return;

    const overIndex = overId in kanban 
      ? kanban[overCol].length 
      : kanban[overCol].findIndex(i => i._id === overId);

    if (activeId !== overId || activeCol !== overCol) {
      await moveTask(activeId, {
        fromStatus: activeCol,
        toStatus: overCol,
        newOrder: overIndex,
      });

      // Notify others
      socketService.emit('task:move', {
        taskId: activeId,
        fromStatus: activeCol,
        toStatus: overCol,
        newOrder: overIndex,
        tenantId: currentTenant._id,
        projectId: selectedProjectId || (activeTask && activeTask.projectId),
      });
    }
  };

  const findColumn = (id) => {
    if (id in kanban) return id;
    for (const [colId, tasks] of Object.entries(kanban)) {
      if (tasks.find(t => t._id === id)) return colId;
    }
    return null;
  };

  const hasAnyTasks = Object.values(kanban).some((col) => col.length > 0);

  const handleAddTask = (status) => {
    setFormData({ ...formData, status, projectId: selectedProjectId });
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
      fetchKanban(selectedProjectId);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tasks</h1>
          <p className="text-dark-400 text-sm mt-1">Manage and track your team's deliverables</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-dark-800/50 border border-dark-600/30 text-dark-200 text-sm rounded-xl px-4 py-2 hover:border-primary-500/30 transition-all outline-none"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
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
      <div className="flex items-center gap-1 bg-dark-800/40 p-1 rounded-xl w-fit shrink-0 backdrop-blur-md border border-white/5">
        {[
          { id: 'kanban', icon: HiOutlineViewGrid, label: 'Kanban' },
          { id: 'list', icon: HiOutlineViewList, label: 'List' },
          { id: 'calendar', icon: HiOutlineCalendar, label: 'Calendar' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              view === v.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
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
          view === 'kanban' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToWindowEdges]}
            >
              <div className="flex gap-6 h-full overflow-x-auto pb-6 scroll-smooth custom-scrollbar">
                {Object.entries(kanban).map(([status, tasks]) => (
                  <KanbanColumn key={status} status={status} tasks={tasks} onAddTask={handleAddTask} />
                ))}
              </div>

              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.5' } },
                }),
              }}>
                {activeTask ? (
                  <TaskCard task={activeTask} isOverlay />
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
              <p className="text-dark-400 italic">List and Calendar views are coming soon...</p>
            </div>
          )
        )}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Task" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-dark-300 text-sm block mb-1.5 font-medium">Title *</label>
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
            <label className="text-dark-300 text-sm block mb-1.5 font-medium">Description</label>
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
              <label className="text-dark-300 text-sm block mb-1.5 font-medium">Project *</label>
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
              <label className="text-dark-300 text-sm block mb-1.5 font-medium">Status</label>
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
              <label className="text-dark-300 text-sm block mb-1.5 font-medium">Priority</label>
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
              <label className="text-dark-300 text-sm block mb-1.5 font-medium">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="frontend, bug (comma-separated)"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost border border-dark-600/40 rounded-xl text-center justify-center font-bold">
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={creating || !formData.title.trim() || !formData.projectId}
              className="flex-1 btn-primary justify-center disabled:opacity-50 font-bold"
            >
              {creating ? 'Creating...' : 'Create Task'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
