import { create } from 'zustand';
import api from '../services/api';

export const useTaskStore = create((set) => ({
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
}));

export const useProjectStore = create((set) => ({
  projects: [],
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
    return data.data;
  },

  deleteProject: async (projectId) => {
    await api.delete(`/projects/${projectId}`);
    set((state) => ({ projects: state.projects.filter((p) => p._id !== projectId) }));
  },
}));
