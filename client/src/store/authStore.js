import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('saasify_user') || 'null'),
  accessToken: localStorage.getItem('saasify_token') || null,
  tenants: JSON.parse(localStorage.getItem('saasify_tenants') || '[]'),
  currentTenant: JSON.parse(localStorage.getItem('saasify_current_tenant') || 'null'),
  isLoading: false,
  error: null,

  setAccessToken: (token) => {
    localStorage.setItem('saasify_token', token);
    set({ accessToken: token });
  },

  setCurrentTenant: (tenant) => {
    localStorage.setItem('saasify_current_tenant', JSON.stringify(tenant));
    set({ currentTenant: tenant });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, tenants, accessToken } = data.data;
      const firstTenant = tenants[0]?.tenant || null;

      localStorage.setItem('saasify_user', JSON.stringify(user));
      localStorage.setItem('saasify_token', accessToken);
      localStorage.setItem('saasify_tenants', JSON.stringify(tenants));
      localStorage.setItem('saasify_current_tenant', JSON.stringify(firstTenant));

      set({
        user,
        accessToken,
        tenants,
        currentTenant: firstTenant,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (name, email, password, tenantName) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, tenantName });
      const { user, tenant, accessToken } = data.data;

      localStorage.setItem('saasify_user', JSON.stringify(user));
      localStorage.setItem('saasify_token', accessToken);
      localStorage.setItem('saasify_tenants', JSON.stringify([{ tenant, role: 'admin' }]));
      localStorage.setItem('saasify_current_tenant', JSON.stringify(tenant));

      set({
        user,
        accessToken,
        tenants: [{ tenant, role: 'admin' }],
        currentTenant: tenant,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('saasify_user');
    localStorage.removeItem('saasify_token');
    localStorage.removeItem('saasify_tenants');
    localStorage.removeItem('saasify_current_tenant');
    set({ user: null, accessToken: null, tenants: [], currentTenant: null });
  },

  acceptInvite: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/auth/accept-invite/${token}`);
      
      // Re-fetch current user and memberships after accepting
      const { data } = await api.get('/tenants/my');
      const tenants = data.data;
      
      localStorage.setItem('saasify_tenants', JSON.stringify(tenants));
      set({ tenants, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to accept invitation', isLoading: false });
      return false;
    }
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const [userRes, tenantsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/tenants/my')
      ]);
      
      const user = userRes.data.data.user;
      const tenants = tenantsRes.data.data;
      const firstTenant = tenants[0]?.tenant || null;

      localStorage.setItem('saasify_user', JSON.stringify(user));
      localStorage.setItem('saasify_tenants', JSON.stringify(tenants));
      localStorage.setItem('saasify_current_tenant', JSON.stringify(firstTenant));

      set({
        user,
        tenants,
        currentTenant: firstTenant,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false });
      return false;
    }
  },
}));
