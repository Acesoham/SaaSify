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
import { HiOutlineUserAdd, HiOutlineCheck, HiOutlineX, HiOutlineShieldCheck } from 'react-icons/hi';

const priorityConfig = {
  low:    { label: 'low',    class: 'badge-low',    dot: 'bg-[#969A92]' },
  medium: { label: 'medium', class: 'badge-medium', dot: 'bg-[#3478B9]' },
  high:   { label: 'high',   class: 'badge-high',   dot: 'bg-[#A96612]' },
  urgent: { label: 'urgent', class: 'badge-urgent', dot: 'bg-[#C43D3D]' },
};

const columnConfig = {
  backlog:     { label: 'Backlog',     dot: 'bg-[#969A92]',  header: 'bg-[#F8F9F5]' },
  todo:        { label: 'To Do',       dot: 'bg-[#A96612]',  header: 'bg-[#FFF8EF]' },
  'in-progress':{ label: 'In Progress',dot: 'bg-[#3478B9]',  header: 'bg-[#EFF5FF]' },
  review:      { label: 'Review',      dot: 'bg-[#6B4DA0]',  header: 'bg-[#F4EFFF]' },
  done:        { label: 'Done',        dot: 'bg-[#287D48]',  header: 'bg-[#EDFCF3]' },
};

function TaskCard({ task, index, isOverlay, ...props }) {
  const p = priorityConfig[task.priority] || priorityConfig.medium;
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <motion.div
      initial={!isOverlay ? { opacity: 0, y: 8 } : {}}
      animate={!isOverlay ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.04 }}
      whileHover={!isOverlay ? { y: -1 } : {}}
      className={`bg-white border border-[#E5E7E0] rounded-xl p-4 cursor-grab active:cursor-grabbing
                  hover:border-[#C4F13B]/50 hover:shadow-[0_2px_8px_rgba(23,24,32,0.08)] transition-all
                  ${isOverlay ? 'shadow-[0_8px_24px_rgba(23,24,32,0.15)] scale-[1.02] opacity-95' : ''}`}
      {...props}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className={`w-2 h-2 rounded-full ${p.dot}`} />
        <span className={`${p.class} text-[10px] font-semibold uppercase tracking-wide`}>{p.label}</span>
      </div>

      <h4 className="text-[#171820] font-semibold text-sm mb-1 line-clamp-2 leading-snug">{task.title}</h4>
      <p className="text-[#6B7068] text-xs mb-3 line-clamp-2 leading-relaxed">{task.description}</p>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium bg-[#F1F3ED] text-[#6B7068] px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-[#F1F3ED]">
        <div className="flex -space-x-1.5">
          {(task.assignees || []).slice(0, 3).map((a, i) => (
            <div
              key={i}
              title={a.name}
              className="w-6 h-6 rounded-full bg-[#EFF9D4] border-2 border-white flex items-center justify-center text-[9px] text-[#171820] font-bold overflow-hidden"
            >
              {a.avatar ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" /> : (a.name?.charAt(0) || '?')}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2.5 text-[#969A92] text-[10px]">
          {task.commentCount > 0 && <span className="flex items-center gap-0.5">💬 {task.commentCount}</span>}
          {deadlineStr && <span className="flex items-center gap-0.5">📅 {deadlineStr}</span>}
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
    data: { type: 'Task', task },
  });

  const style = { transition, transform: CSS.Translate.toString(transform) };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-[#EFF9D4]/40 border-2 border-dashed border-[#C4F13B]/40 rounded-xl h-28 w-full"
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
    <div className="flex-1 min-w-[280px] flex flex-col h-full bg-[#F8F9F5] rounded-xl border border-[#E5E7E0]">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7E0] rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${col.dot}`} />
          <h3 className="text-[#171820] font-semibold text-sm">{col.label}</h3>
          <span className="bg-white text-[#6B7068] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#E5E7E0]">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1 rounded-lg hover:bg-[#E5E7E0] text-[#969A92] hover:text-[#171820] transition-all"
        >
          <HiOutlinePlus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 p-3 min-h-[460px]">
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
          <div className="border-2 border-dashed border-[#E5E7E0] rounded-xl p-6 text-center flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#F1F3ED] flex items-center justify-center mb-2">
              <HiOutlineClipboardList className="w-4 h-4 text-[#969A92]" />
            </div>
            <p className="text-[#969A92] text-xs">No tasks in {col.label.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { kanban, fetchKanban, createTask, moveTask, setKanban } = useTaskStore();
  const { projects, fetchProjects, fetchProjectMembers, addMemberToProject, fetchTenantMembers, tenantMembers } = useProjectStore();
  const { accessToken, currentTenant } = useAuthStore();
  const [activeTask, setActiveTask] = useState(null);
  const [view, setView] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', projectId: '', tags: '',
  });
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [grantAccess, setGrantAccess] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProjects();
    fetchTenantMembers();
    fetchKanban(selectedProjectId);

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
    setSelectedAssignees([]);
    setGrantAccess({});
    fetchTenantMembers(); // always refresh member list
    if (selectedProjectId) {
      fetchProjectMembers(selectedProjectId).then(setProjectMembers);
    } else {
      setProjectMembers([]);
    }
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
        assignees: selectedAssignees.map((a) => a._id),
      };
      await createTask(taskData);

      // Grant project access to assignees who don't have it yet
      const grantPromises = selectedAssignees
        .filter((a) => grantAccess[a._id])
        .map((a) => addMemberToProject(formData.projectId, a._id).catch(() => {}));
      await Promise.all(grantPromises);

      setShowModal(false);
      setFormData({ title: '', description: '', status: 'todo', priority: 'medium', projectId: '', tags: '' });
      setSelectedAssignees([]);
      setGrantAccess({});
      fetchKanban(selectedProjectId);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  // When the project changes in the modal, reload members
  const handleModalProjectChange = async (projectId) => {
    setFormData((prev) => ({ ...prev, projectId }));
    setSelectedAssignees([]);
    setGrantAccess({});
    fetchTenantMembers(); // refresh in case new members joined
    if (projectId) {
      const members = await fetchProjectMembers(projectId);
      setProjectMembers(members);
    } else {
      setProjectMembers([]);
    }
  };

  const toggleAssignee = (member) => {
    setSelectedAssignees((prev) => {
      const exists = prev.find((a) => a._id === member._id);
      if (exists) {
        // Remove and clear grant access flag
        setGrantAccess((g) => { const n = { ...g }; delete n[member._id]; return n; });
        return prev.filter((a) => a._id !== member._id);
      }
      return [...prev, member];
    });
  };

  // Returns true if the user is NOT yet a project member
  const isNonMember = (userId) => !projectMembers.find((m) => m._id === userId);

  return (
    <div className="space-y-5 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#171820]">Tasks</h1>
          <p className="text-[#6B7068] text-sm mt-0.5">Manage and track your team's deliverables</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white border border-[#E5E7E0] text-[#171820] text-sm rounded-lg px-3 py-2 hover:border-[#C4F13B]/50 transition-all outline-none focus:ring-2 focus:ring-[#C4F13B]/30"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFormData({ ...formData, status: 'todo', projectId: selectedProjectId });
              setSelectedAssignees([]);
              setGrantAccess({});
              fetchTenantMembers(); // always refresh member list
              if (selectedProjectId) {
                fetchProjectMembers(selectedProjectId).then(setProjectMembers);
              } else {
                setProjectMembers([]);
              }
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Task
          </motion.button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg w-fit shrink-0 border border-[#E5E7E0]">
        {[
          { id: 'kanban',   icon: HiOutlineViewGrid,  label: 'Kanban' },
          { id: 'list',     icon: HiOutlineViewList,   label: 'List' },
          { id: 'calendar', icon: HiOutlineCalendar,   label: 'Calendar' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === v.id
                ? 'bg-[#C4F13B] text-[#171820] shadow-sm'
                : 'text-[#6B7068] hover:text-[#171820] hover:bg-[#F1F3ED]'
            }`}
          >
            <v.icon className="w-3.5 h-3.5" /> {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!hasAnyTasks ? (
          <EmptyState
            icon={HiOutlineClipboardList}
            title="No tasks yet"
            description={
              projects.length === 0
                ? 'Create a project first, then add tasks to it.'
                : 'Start adding tasks to your projects to organize your workflow.'
            }
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
              <div className="flex gap-4 h-full overflow-x-auto pb-4 scroll-smooth">
                {Object.entries(kanban).map(([status, tasks]) => (
                  <KanbanColumn key={status} status={status} tasks={tasks} onAddTask={handleAddTask} />
                ))}
              </div>

              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.4' } },
                }),
              }}>
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="bg-white border border-[#E5E7E0] rounded-xl p-12 text-center">
              <p className="text-[#969A92] text-sm">List and Calendar views are coming soon…</p>
            </div>
          )
        )}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Task" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Title *</label>
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
            <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Description</label>
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
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => handleModalProjectChange(e.target.value)}
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
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Status</label>
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

          {/* Assign To */}
          <div>
            <label className="text-[#6B7068] text-sm block mb-2 font-medium flex items-center gap-1.5">
              <HiOutlineUserAdd className="w-4 h-4" /> Assign To
            </label>

            {!formData.projectId ? (
              <div className="bg-[#F8F9F5] border border-dashed border-[#E5E7E0] rounded-xl p-3 text-center">
                <p className="text-[#969A92] text-xs">Select a project first to see team members.</p>
              </div>
            ) : tenantMembers.filter(m => m.userId).length === 0 ? (
              <div className="bg-[#F8F9F5] border border-dashed border-[#E5E7E0] rounded-xl p-3 text-center">
                <p className="text-[#969A92] text-xs">No team members in this workspace yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Selected assignees — shown as removable chips */}
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[#F1F3ED]">
                    {selectedAssignees.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 bg-[#C4F13B] rounded-lg text-xs font-semibold text-[#171820]"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#171820]/10 flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0">
                          {user.avatar
                            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            : user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleAssignee(user)}
                          className="w-4 h-4 rounded-full bg-[#171820]/15 hover:bg-[#171820]/30 flex items-center justify-center transition-all flex-shrink-0"
                          title="Remove assignee"
                        >
                          <HiOutlineX className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* All tenant members — click to add */}
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                  {tenantMembers.map((m) => {
                    const user = m.userId;
                    if (!user) return null;
                    const isSelected = selectedAssignees.some((a) => a._id === user._id);
                    if (isSelected) return null; // already shown as chip above
                    const notInProject = !projectMembers.some((pm) => {
                      const pmId = pm._id || pm.userId?._id || pm.userId;
                      return pmId === user._id;
                    });
                    return (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => toggleAssignee(user)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7E0] bg-white text-xs font-medium text-[#6B7068] hover:border-[#C4F13B] hover:bg-[#F8FFED] hover:text-[#171820] transition-all"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#EFF9D4] flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0">
                          {user.avatar
                            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            : user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                        {notInProject && (
                          <span className="text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded">No project access</span>
                        )}
                        <HiOutlinePlus className="w-3 h-3 text-[#C4F13B]" />
                      </button>
                    );
                  })}
                </div>

                {/* Grant workstation access for assignees not in project */}
                {selectedAssignees.filter((a) => {
                  return !projectMembers.some((pm) => {
                    const pmId = pm._id || pm.userId?._id || pm.userId;
                    return pmId === a._id;
                  });
                }).length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[#6B7068] text-xs font-medium flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                      Grant project access to:
                    </p>
                    {selectedAssignees
                      .filter((a) => !projectMembers.some((pm) => {
                        const pmId = pm._id || pm.userId?._id || pm.userId;
                        return pmId === a._id;
                      }))
                      .map((a) => (
                        <label key={a._id} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200/70 rounded-lg cursor-pointer hover:bg-orange-100 transition-all">
                          <input
                            type="checkbox"
                            checked={!!grantAccess[a._id]}
                            onChange={(e) => setGrantAccess((g) => ({ ...g, [a._id]: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-[#C4F13B]"
                          />
                          <span className="text-xs font-medium text-[#171820]">{a.name}</span>
                          <span className="text-[10px] text-orange-600 ml-auto">will be added to this project</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Priority</label>
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
              <label className="text-[#6B7068] text-sm block mb-1.5 font-medium">Tags</label>
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
