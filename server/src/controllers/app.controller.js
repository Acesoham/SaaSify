import { appService } from '../services/app.service.js';

export const appController = {
  /**
   * POST /api/apps
   * Connect a new GitHub repository as a deployable app.
   */
  async createApp(req, res, next) {
    try {
      const { name, repoFullName, defaultBranch, buildCommand, startCommand, rootDirectory, containerPort } = req.body;
      const app = await appService.createApp({
        userId: req.userId,
        tenantId: req.tenantId,
        name,
        repoFullName,
        defaultBranch,
        buildCommand,
        startCommand,
        rootDirectory,
        containerPort,
      });
      res.status(201).json({ success: true, data: app });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/apps
   * List all apps in the current tenant.
   */
  async listApps(req, res, next) {
    try {
      const apps = await appService.listApps(req.tenantId);
      res.json({ success: true, data: apps });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/apps/:id
   * Get a single app by ID.
   */
  async getApp(req, res, next) {
    try {
      const app = await appService.getApp(req.params.id, req.tenantId);
      res.json({ success: true, data: app });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/apps/:id/envvars
   * Update environment variables for an app.
   * Body: { envVars: [{ key, value }] }
   */
  async updateEnvVars(req, res, next) {
    try {
      const keys = await appService.updateEnvVars(req.params.id, req.tenantId, req.body.envVars || []);
      res.json({ success: true, data: { keys }, message: 'Environment variables updated' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/apps/:id
   * Soft-delete an app and remove its GitHub webhook.
   */
  async deleteApp(req, res, next) {
    try {
      const result = await appService.deleteApp(req.params.id, req.tenantId, req.userId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/apps/:id/deploy
   * Manually trigger a new deployment.
   */
  async triggerDeployment(req, res, next) {
    try {
      const deployment = await appService.triggerDeployment(req.params.id, req.tenantId, req.userId);
      res.status(202).json({ success: true, data: deployment, message: 'Deployment queued' });
    } catch (err) {
      next(err);
    }
  },
};
