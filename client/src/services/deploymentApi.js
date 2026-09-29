import api from './api.js';

// ─── GitHub ───────────────────────────────────────────────────────────────────

export const githubApi = {
  /** Get GitHub connection status for the current user */
  getStatus: () => api.get('/github/status'),

  /**
   * Initiates GitHub OAuth.
   * 1. Calls /api/github/auth-url with JWT (so server can embed userId in state)
   * 2. Server returns the full GitHub OAuth URL
   * 3. Frontend navigates the browser there
   */
  initiateAuth: async (login) => {
    const params = login ? `?login=${encodeURIComponent(login)}` : '';
    const res = await api.get(`/github/auth-url${params}`);
    window.location.href = res.data.data.url;
  },

  /** Disconnect GitHub account */
  disconnect: () => api.delete('/github/disconnect'),

  /** List accessible repos */
  listRepos: (page = 1, perPage = 30) =>
    api.get('/github/repos', { params: { page, per_page: perPage } }),

  /** List branches for a repo */
  listBranches: (owner, repo) =>
    api.get(`/github/repos/${owner}/${repo}/branches`),
};

// ─── Apps ─────────────────────────────────────────────────────────────────────

export const appsApi = {
  /** Connect a new GitHub repo as a deployable app */
  create: (data) => api.post('/apps', data),

  /** List all apps in the current tenant */
  list: () => api.get('/apps'),

  /** Get a single app */
  get: (id) => api.get(`/apps/${id}`),

  /** Trigger a manual deployment */
  deploy: (id) => api.post(`/apps/${id}/deploy`),

  /** Update environment variables */
  updateEnvVars: (id, envVars) => api.patch(`/apps/${id}/envvars`, { envVars }),

  /** Delete an app */
  delete: (id) => api.delete(`/apps/${id}`),
};

// ─── Deployments ──────────────────────────────────────────────────────────────

export const deploymentsApi = {
  /** List deployments for an app */
  listForApp: (appId, page = 1) =>
    api.get(`/deployments/${appId}/list`, { params: { page } }),

  /** Get a single deployment */
  get: (id) => api.get(`/deployments/${id}`),

  /** Get stored log lines */
  getLogs: (id) => api.get(`/deployments/${id}/logs`),

  /** Stop a running deployment */
  stop: (id) => api.post(`/deployments/${id}/stop`),
};
