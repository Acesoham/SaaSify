import { deploymentService } from '../services/deployment.service.js';

export const deploymentController = {
  /**
   * GET /api/deployments/:appId/list
   * List deployments for an app.
   */
  async listDeployments(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await deploymentService.listDeployments(
        req.params.appId,
        req.tenantId,
        { page: Number(page) || 1, limit: Number(limit) || 20 }
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/deployments/:id
   * Get a single deployment.
   */
  async getDeployment(req, res, next) {
    try {
      const deployment = await deploymentService.getDeployment(req.params.id, req.tenantId);
      res.json({ success: true, data: deployment });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/deployments/:id/logs
   * Get deployment log lines.
   */
  async getLogs(req, res, next) {
    try {
      const logs = await deploymentService.getDeploymentLogs(req.params.id, req.tenantId);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/deployments/:id/stop
   * Stop a running deployment.
   */
  async stopDeployment(req, res, next) {
    try {
      const deployment = await deploymentService.stopDeployment(req.params.id, req.tenantId);
      res.json({ success: true, data: deployment, message: 'Deployment stopped' });
    } catch (err) {
      next(err);
    }
  },
};
