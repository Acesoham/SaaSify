import { create } from 'zustand';
import api from '../services/api';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  kanban: { backlog: [], todo: [], 'in-progress': [], review: [], done: [] },
  isLoading: false,
  total: 0,

  fetchTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/tasks', { params });
      set({ tasks: data.data.tasks, total: data.data.total, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchKanban: async (projectId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/tasks/kanban', { params: { projectId } });
      set({ kanban: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    set((state) => ({ tasks: [data.data, ...state.tasks] }));
    return data.data;
  },

  updateTask: async (taskId, updates) => {
    const { data } = await api.put(`/tasks/${taskId}`, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === taskId ? data.data : t)),
    }));
    return data.data;
  },

  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) }));
  },

  moveTask: async (taskId, { fromStatus, toStatus, newOrder }) => {
    const previousKanban = get().kanban;
    // Optimistic update
    set((state) => {
      const sourceCol = [...state.kanban[fromStatus]];
      const taskIndex = sourceCol.findIndex((t) => t._id === taskId);
      if (taskIndex === -1) return state;

      const [task] = sourceCol.splice(taskIndex, 1);
      const updatedTask = { ...task, status: toStatus, order: newOrder };

      const targetCol = fromStatus === toStatus ? sourceCol : [...state.kanban[toStatus]];
      targetCol.splice(newOrder, 0, updatedTask);

      return {
        kanban: {
          ...state.kanban,
          [fromStatus]: sourceCol,
          [toStatus]: targetCol,
        },
      };
    });

    try {
      await api.put(`/tasks/${taskId}`, { status: toStatus, order: newOrder });
    } catch (err) {
      console.error('Failed to update task position:', err);
      set({ kanban: previousKanban });
    }
  },

  setKanban: (kanban) => set({ kanban }),
}));

export const useProjectStore = create((set) => ({
  projects: [],
  tenantMembers: [],
  isLoading: false,
  total: 0,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/projects', { params });
      set({ projects: data.data.projects, total: data.data.total, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchTenantMembers: async () => {
    try {
      const { data } = await api.get('/tenants/members');
      set({ tenantMembers: data.data });
    } catch (err) {
      console.error('Failed to fetch tenant members:', err);
    }
  },

  fetchProjectMembers: async (projectId) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/members`);
      return data.data;
    } catch (err) {
      console.error('Failed to fetch project members:', err);
      return [];
    }
  },

  addMemberToProject: async (projectId, userId) => {
    const { data } = await api.post(`/projects/${projectId}/members`, { userId });
    set((state) => ({
      projects: state.projects.map((project) => project._id === projectId
        ? { ...project, members: data.data }
        : project),
    }));
    return { members: data.data, githubAccess: data.githubAccess };
  },

  removeMemberFromProject: async (projectId, userId) => {
    const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);
    set((state) => ({
      projects: state.projects.map((project) => project._id === projectId
        ? { ...project, members: data.data }
        : project),
    }));
    return { members: data.data, githubAccess: data.githubAccess };
  },

  grantRepoAccessToProjectMember: async (projectId, userId) => {
    const { data } = await api.post(`/projects/${projectId}/members/${userId}/github-access`);
    return data.data;
  },

  createProject: async (projectData) => {
    const { data } = await api.post('/projects', projectData);
    set((state) => ({ projects: [data.data, ...state.projects] }));
    return data.data;
  },

  updateProject: async (projectId, updates) => {
    const { data } = await api.put(`/projects/${projectId}`, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p._id === projectId ? data.data : p)),
    }));
    return { project: data.data, githubAccess: data.githubAccess || [] };
  },

  deleteProject: async (projectId) => {
    await api.delete(`/projects/${projectId}`);
    set((state) => ({ projects: state.projects.filter((p) => p._id !== projectId) }));
  },
}));
