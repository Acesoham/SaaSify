import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { HiOutlinePlus, HiOutlineFilter, HiOutlineViewGrid, HiOutlineViewList, HiOutlineCalendar, HiOutlineClipboardList, HiOutlineUpload, HiOutlineDownload, HiOutlineFolder, HiOutlineClock } from 'react-icons/hi';
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
import { HiOutlineUserAdd, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import api from '../services/api';

const MAX_SUBMISSION_SIZE = 8 * 1024 * 1024;

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

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

function TaskCard({ task, index, isOverlay, canSubmit, isAdmin, onOpenSubmissions, ...props }) {
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

      {!isOverlay && (canSubmit || (isAdmin && task.submissionCount > 0)) && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onOpenSubmissions(task);
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E5E7E0] bg-[#F8F9F5] px-2.5 py-2 text-xs font-semibold text-[#171820] hover:border-[#C4F13B] hover:bg-[#F8FFED]"
        >
          {isAdmin && task.submissionCount > 0
            ? <><HiOutlineCheck className="h-4 w-4" />{task.pendingSubmissionCount > 0 ? `Review work (${task.pendingSubmissionCount})` : `View submissions (${task.submissionCount})`}</>
            : <><HiOutlineUpload className="h-4 w-4" />{task.pendingSubmissionCount > 0 ? 'Waiting for review' : task.status === 'done' ? 'View submission' : 'Submit work'}</>}
        </button>
      )}
    </motion.div>
  );
}

function SortableTaskCard({ task, index, canManageTask, canSubmit, isAdmin, onOpenSubmissions }) {
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
    disabled: !canManageTask,
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
    <div ref={setNodeRef} style={style} {...attributes} {...(canManageTask ? listeners : {})}>
      <TaskCard task={task} index={index} canSubmit={canSubmit} isAdmin={isAdmin} onOpenSubmissions={onOpenSubmissions} />
    </div>
  );
}

function KanbanColumn({ status, tasks, onAddTask, canCreateTasks, canManageTask, canSubmitTask, isAdmin, onOpenSubmissions }) {
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
        {canCreateTasks && (
          <button
            onClick={() => onAddTask(status)}
            className="p-1 rounded-lg hover:bg-[#E5E7E0] text-[#969A92] hover:text-[#171820] transition-all"
          >
            <HiOutlinePlus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 p-3 min-h-[460px]">
        <SortableContext
          id={status}
          items={tasks.map(t => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, idx) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              index={idx}
              canManageTask={canManageTask(task)}
              canSubmit={canSubmitTask(task)}
              isAdmin={isAdmin}
              onOpenSubmissions={onOpenSubmissions}
            />
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
  const { user, accessToken, currentTenant, tenants } = useAuthStore();
  const tenantRole = tenants.find((entry) => String(entry.tenant?._id) === String(currentTenant?._id))?.role;
  const isAdmin = tenantRole === 'admin';
  const canManageTasks = tenantRole === 'admin' || tenantRole === 'member';
  const accessibleProjects = useMemo(() => {
    const userId = String(user?._id || '');
    return projects.filter((project) =>
      isAdmin
      || String(project.owner?._id || project.owner || '') === userId
      || (project.members || []).some((member) => String(member._id || member) === userId)
      || Object.values(kanban).flat().some((task) =>
        String(task.projectId?._id || task.projectId || '') === String(project._id)
      )
    );
  }, [projects, user?._id, kanban, isAdmin]);
  const manageableProjects = useMemo(() => projects.filter((project) => {
    const userId = String(user?._id || '');
    return isAdmin
      || String(project.owner?._id || project.owner || '') === userId
      || (project.members || []).some((member) => String(member._id || member) === userId);
  }), [projects, user?._id, isAdmin]);
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
  const [formError, setFormError] = useState('');
  const [accessNotice, setAccessNotice] = useState('');
  const [submissionTask, setSubmissionTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionSaving, setSubmissionSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [reviewComments, setReviewComments] = useState({});
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProjects();
    fetchTenantMembers();
    fetchKanban(selectedProjectId);
  }, [selectedProjectId, currentTenant?._id]);

  useEffect(() => {
    if (!accessToken || !currentTenant) return undefined;

    socketService.connect(accessToken);
    const projectIds = selectedProjectId
      ? [selectedProjectId]
      : accessibleProjects.map((project) => project._id);
    projectIds.forEach((projectId) => socketService.joinProject(projectId));

    const refreshBoard = () => fetchKanban(selectedProjectId);
    const handleProjectAccessGranted = () => {
      fetchProjects();
      fetchKanban(selectedProjectId);
    };
    const handleProjectAccessRevoked = ({ projectId }) => {
      fetchProjects();
      if (selectedProjectId === projectId) setSelectedProjectId('');
      else fetchKanban(selectedProjectId);
    };

    socketService.on('task:created', refreshBoard);
    socketService.on('task:updated', refreshBoard);
    socketService.on('task:deleted', refreshBoard);
    socketService.on('project:access_granted', handleProjectAccessGranted);
    socketService.on('project:access_revoked', handleProjectAccessRevoked);

    return () => {
      projectIds.forEach((projectId) => socketService.leaveProject(projectId));
      socketService.off('task:created', refreshBoard);
      socketService.off('task:updated', refreshBoard);
      socketService.off('task:deleted', refreshBoard);
      socketService.off('project:access_granted', handleProjectAccessGranted);
      socketService.off('project:access_revoked', handleProjectAccessRevoked);
    };
  }, [accessibleProjects, selectedProjectId, accessToken, currentTenant, fetchKanban, fetchProjects]);

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
  const hasPendingSubmission = Boolean(submissionTask)
    && (Number(submissionTask.pendingSubmissionCount || 0) > 0 || submissions.some((item) => item.status === 'submitted'));

  const canSubmitTask = (task) => (task.assignees || []).some((assignee) =>
    String(assignee._id || assignee) === String(user?._id)
  );

  const canManageTask = (task) => {
    if (!canManageTasks) return false;
    if (isAdmin) return true;
    const projectId = String(task.projectId?._id || task.projectId || '');
    const project = projects.find((item) => String(item._id) === projectId);
    const userId = String(user?._id || '');
    return Boolean(project && (
      String(project.owner?._id || project.owner || '') === userId
      || (project.members || []).some((member) => String(member._id || member) === userId)
    ));
  };

  const openSubmissions = async (task) => {
    setSubmissionTask(task);
    setSubmissions([]);
    setSubmissionFiles([]);
    setSubmissionNote('');
    setReviewComments({});
    setSubmissionError('');
    setSubmissionsLoading(true);
    try {
      const { data } = await api.get(`/tasks/${task._id}/submissions`);
      setSubmissions(data.data);
    } catch (error) {
      setSubmissionError(error.response?.data?.message || 'Could not load task submissions.');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleSubmissionFiles = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    event.target.value = '';
    const nextFiles = [...submissionFiles, ...incomingFiles];
    const uniqueFiles = [...new Map(nextFiles.map((file) => [
      `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`,
      file,
    ])).values()];
    const totalSize = uniqueFiles.reduce((total, file) => total + file.size, 0);

    if (uniqueFiles.length > 100) {
      setSubmissionError('A submission can contain up to 100 files.');
      return;
    }
    if (uniqueFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setSubmissionError('Each file must be 5 MB or smaller.');
      return;
    }
    if (totalSize > MAX_SUBMISSION_SIZE) {
      setSubmissionError('The total submission size must be 8 MB or smaller.');
      return;
    }

    setSubmissionError('');
    setSubmissionFiles(uniqueFiles);
  };

  const submitWork = async (event) => {
    event.preventDefault();
    if (!submissionTask || submissionFiles.length === 0) return;

    setSubmissionSaving(true);
    setSubmissionError('');
    try {
      const files = await Promise.all(submissionFiles.map(async (file) => ({
        name: file.name,
        relativePath: file.webkitRelativePath || file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        contentBase64: await fileToBase64(file),
      })));
      const { data } = await api.post(`/tasks/${submissionTask._id}/submissions`, {
        files,
        note: submissionNote,
      });
      setSubmissions((current) => [data.data, ...current]);
      setSubmissionFiles([]);
      setSubmissionNote('');
      setSubmissionTask((current) => current ? {
        ...current,
        status: 'review',
        submissionCount: (current.submissionCount || 0) + 1,
        pendingSubmissionCount: 1,
      } : current);
      await fetchKanban(selectedProjectId);
    } catch (error) {
      setSubmissionError(error.response?.data?.message || 'Could not submit this work. Please try again.');
    } finally {
      setSubmissionSaving(false);
    }
  };

  const reviewSubmission = async (submission, decision) => {
    const comment = reviewComments[submission._id] || '';
    if (decision === 'request_changes' && !comment.trim()) {
      setSubmissionError('Add a comment explaining what needs to change.');
      return;
    }

    setReviewingSubmissionId(submission._id);
    setSubmissionError('');
    try {
      const { data } = await api.patch(`/tasks/submissions/${submission._id}/review`, { decision, comment });
      setSubmissions((current) => current.map((item) => item._id === submission._id ? data.data : item));
      setSubmissionTask((current) => current ? {
        ...current,
        status: data.task.status,
        pendingSubmissionCount: data.task.pendingSubmissionCount,
      } : current);
      await fetchKanban(selectedProjectId);
    } catch (error) {
      setSubmissionError(error.response?.data?.message || 'Could not update this submission review.');
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  const downloadSubmissionFile = async (submissionId, file) => {
    try {
      const response = await api.get(
        `/tasks/submissions/${submissionId}/files/${file._id}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setSubmissionError(error.response?.data?.message || 'Could not download this file.');
    }
  };

  const handleAddTask = (status) => {
    const defaultProjectId = manageableProjects.some((project) => String(project._id) === String(selectedProjectId))
      ? selectedProjectId
      : '';
    setFormData({ ...formData, status, projectId: defaultProjectId });
    setSelectedAssignees([]);
    fetchTenantMembers(); // always refresh member list
    if (defaultProjectId) {
      fetchProjectMembers(defaultProjectId).then(setProjectMembers);
    } else {
      setProjectMembers([]);
    }
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) return;

    const projectMemberIds = new Set(projectMembers.map((member) =>
      String(member._id || member.userId?._id || member.userId)
    ));
    const nonMembers = selectedAssignees.filter((assignee) => !projectMemberIds.has(String(assignee._id)));

    setCreating(true);
    setFormError('');
    try {
      const membershipResults = await Promise.all(
        nonMembers.map((assignee) => addMemberToProject(formData.projectId, assignee._id))
      );

      const githubMessages = [...new Set(membershipResults
        .map((result) => result.githubAccess)
        .filter((access) => ['invited', 'github_not_connected', 'failed'].includes(access?.status))
        .map((access) => access.message))];

      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        assignees: selectedAssignees.map((a) => a._id),
      };
      await createTask(taskData);

      setShowModal(false);
      setFormData({ title: '', description: '', status: 'todo', priority: 'medium', projectId: '', tags: '' });
      setSelectedAssignees([]);
      setFormError('');
      setAccessNotice(githubMessages.join(' '));
      fetchKanban(selectedProjectId);
    } catch (err) {
      console.error('Failed to create task:', err);
      setFormError(err.response?.data?.message || 'Could not create the task. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // When the project changes in the modal, reload members
  const handleModalProjectChange = async (projectId) => {
    setFormData((prev) => ({ ...prev, projectId }));
    setSelectedAssignees([]);
    setFormError('');
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
            {accessibleProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        {canManageTasks && manageableProjects.length > 0 && <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAddTask('todo')}
            className="btn-primary"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Task
          </motion.button>}
        </div>
      </div>

      {accessNotice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-lg border border-[#E5E7E0] bg-[#F8F9F5] px-3 py-2 text-xs text-[#6B7068]">
          <span>{accessNotice}</span>
          <button type="button" onClick={() => setAccessNotice('')} aria-label="Dismiss GitHub access notice">
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>
      )}

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
            title={accessibleProjects.length === 0 ? 'No project access yet' : 'No tasks yet'}
            description={
              accessibleProjects.length === 0
                ? `You are viewing ${currentTenant?.name || 'this workspace'}. Switch to the workspace that owns the project, then ask its admin to add you to that project.`
                : 'Start adding tasks to your projects to organize your workflow.'
            }
            actionLabel={accessibleProjects.length > 0 ? '+ Create Task' : 'Go to Projects'}
            onAction={() => {
              if (accessibleProjects.length > 0) setShowModal(true);
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
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    canCreateTasks={canManageTasks && manageableProjects.length > 0}
                    canManageTask={canManageTask}
                    canSubmitTask={canSubmitTask}
                    isAdmin={isAdmin}
                    onOpenSubmissions={openSubmissions}
                  />
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
                {manageableProjects.map((p) => (
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
            <p className="text-[#969A92] text-xs mb-2">
              Assigning a teammate gives them access to this project and its tasks.
            </p>

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
                          <span className="text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded">Will get project access</span>
                        )}
                        <HiOutlinePlus className="w-3 h-3 text-[#C4F13B]" />
                      </button>
                    );
                  })}
                </div>

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

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          )}

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

      <Modal
        isOpen={!!submissionTask}
        onClose={() => setSubmissionTask(null)}
        title={submissionTask ? `Task work — ${submissionTask.title}` : 'Task work'}
        size="lg"
      >
        {submissionTask && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#E5E7E0] bg-[#F8F9F5] p-3">
              <p className="text-xs text-[#6B7068]">
                Project: <span className="font-semibold text-[#171820]">{submissionTask.projectId?.name || 'Project task'}</span>
              </p>
              {submissionTask.description && <p className="mt-2 whitespace-pre-wrap text-sm text-[#6B7068]">{submissionTask.description}</p>}
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#171820]">Submissions and review</h3>
                {submissionsLoading && <span className="text-xs text-[#969A92]">Loading…</span>}
              </div>

              {!submissionsLoading && submissions.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#E5E7E0] p-4 text-center text-sm text-[#969A92]">
                  No work has been submitted for this task yet.
                </p>
              )}

              {submissions.map((submission) => {
                const isPending = submission.status === 'submitted';
                const canReviewSubmission = isAdmin && isPending
                  && String(submission.submittedBy?._id || submission.submittedBy) !== String(user?._id);
                const statusStyle = submission.status === 'approved'
                  ? 'bg-[#EDFCF3] text-[#287D48]'
                  : submission.status === 'changes_requested'
                    ? 'bg-[#FFF8EF] text-[#A96612]'
                    : 'bg-[#EFF5FF] text-[#3478B9]';

                return (
                  <article key={submission._id} className="space-y-3 rounded-xl border border-[#E5E7E0] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#171820]">{submission.submittedBy?.name || 'Task member'}</p>
                        <p className="text-xs text-[#969A92]">Submitted {new Date(submission.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyle}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                    </div>

                    {submission.note && <p className="whitespace-pre-wrap text-sm text-[#6B7068]">{submission.note}</p>}

                    {submission.files?.length > 0 && (
                      <div className="space-y-1.5 border-t border-[#F1F3ED] pt-3">
                        {submission.files.map((file) => (
                          <div key={file._id} className="flex items-center gap-2 rounded-lg bg-[#F8F9F5] px-2.5 py-2">
                            <HiOutlineFolder className="h-4 w-4 shrink-0 text-[#969A92]" />
                            <span className="min-w-0 flex-1 break-all text-xs text-[#171820]">{file.relativePath}</span>
                            <span className="shrink-0 text-[10px] text-[#969A92]">{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => downloadSubmissionFile(submission._id, file)}
                              className="shrink-0 rounded-md p-1 text-[#6B7068] hover:bg-white hover:text-[#171820]"
                              aria-label={`Download ${file.name}`}
                            >
                              <HiOutlineDownload className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {submission.reviewComment && (
                      <div className="rounded-lg bg-[#F8F9F5] p-3 text-xs text-[#6B7068]">
                        <span className="font-semibold text-[#171820]">Admin feedback:</span> {submission.reviewComment}
                        {submission.reviewedBy?.name && <span className="block mt-1 text-[#969A92]">Reviewed by {submission.reviewedBy.name}</span>}
                      </div>
                    )}

                    {canReviewSubmission && (
                      <div className="space-y-2 border-t border-[#F1F3ED] pt-3">
                        <label className="block text-xs font-medium text-[#6B7068]" htmlFor={`review-comment-${submission._id}`}>
                          Feedback for the assignee
                        </label>
                        <textarea
                          id={`review-comment-${submission._id}`}
                          value={reviewComments[submission._id] || ''}
                          onChange={(event) => setReviewComments((current) => ({ ...current, [submission._id]: event.target.value }))}
                          className="input-field min-h-[70px] resize-y"
                          placeholder="Required when requesting changes"
                          rows={2}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => reviewSubmission(submission, 'request_changes')}
                            disabled={reviewingSubmissionId === submission._id || !(reviewComments[submission._id] || '').trim()}
                            className="btn-secondary justify-center disabled:opacity-50"
                          >
                            Request Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewSubmission(submission, 'approve')}
                            disabled={reviewingSubmissionId === submission._id}
                            className="btn-primary justify-center disabled:opacity-50"
                          >
                            <HiOutlineCheck className="h-4 w-4" /> Approve and Complete Task
                          </button>
                        </div>
                      </div>
                    )}
                    {isAdmin && isPending && !canReviewSubmission && (
                      <p className="rounded-lg bg-[#F8F9F5] px-3 py-2 text-xs text-[#6B7068]">
                        Another workspace admin must review your own submission.
                      </p>
                    )}
                  </article>
                );
              })}
            </section>

            {canSubmitTask(submissionTask) && submissionTask.status !== 'done' && !hasPendingSubmission && (
              <form onSubmit={submitWork} className="space-y-3 border-t border-[#E5E7E0] pt-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#171820]">Submit your work</h3>
                  <p className="mt-1 text-xs text-[#969A92]">
                    Add files or a folder. Your admin will review the submission before the task is completed. Each file can be up to 5 MB; the submission limit is 8 MB total.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="btn-secondary relative cursor-pointer justify-center">
                    <HiOutlineUpload className="h-4 w-4" /> Add files
                    <input type="file" multiple className="absolute inset-0 cursor-pointer opacity-0" onChange={handleSubmissionFiles} />
                  </label>
                  <label className="btn-secondary relative cursor-pointer justify-center">
                    <HiOutlineFolder className="h-4 w-4" /> Add folder
                    <input type="file" multiple webkitdirectory="" directory="" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleSubmissionFiles} />
                  </label>
                </div>

                {submissionFiles.length > 0 && (
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-[#E5E7E0] p-2">
                    {submissionFiles.map((file) => (
                      <div key={`${file.webkitRelativePath || file.name}:${file.lastModified}`} className="flex justify-between gap-3 text-xs text-[#6B7068]">
                        <span className="break-all">{file.webkitRelativePath || file.name}</span>
                        <span className="shrink-0">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  value={submissionNote}
                  onChange={(event) => setSubmissionNote(event.target.value)}
                  className="input-field min-h-[75px] resize-y"
                  placeholder="Add a note for the admin (optional)"
                  maxLength={2000}
                  rows={2}
                />

                <button
                  type="submit"
                  disabled={submissionSaving || submissionFiles.length === 0}
                  className="btn-primary justify-center disabled:opacity-50"
                >
                  <HiOutlineUpload className="h-4 w-4" />
                  {submissionSaving ? 'Submitting…' : 'Submit for Approval'}
                </button>
              </form>
            )}

            {hasPendingSubmission && canSubmitTask(submissionTask) && (
              <p className="flex items-center gap-2 rounded-lg bg-[#EFF5FF] px-3 py-2 text-xs text-[#3478B9]">
                <HiOutlineClock className="h-4 w-4" /> Your work is waiting for admin review.
              </p>
            )}

            {submissionError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{submissionError}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
