import Deployment from '../models/Deployment.js';
import App from '../models/App.js';
import { AppError } from '../middleware/errorHandler.js';
import { dockerService } from '../docker/docker.service.js';
import { nginxService } from '../nginx/nginx.service.js';
import logger from '../config/logger.js';

export const deploymentService = {
  /**
   * List deployments for an app with pagination.
   */
  async listDeployments(appId, tenantId, { page = 1, limit = 20 } = {}) {
    // Verify app belongs to tenant
    const app = await App.findOne({ _id: appId, tenantId });
    if (!app) throw new AppError('App not found', 404);

    const skip = (page - 1) * limit;
    const [deployments, total] = await Promise.all([
      Deployment.find({ appId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-logs'), // exclude logs for listing view
      Deployment.countDocuments({ appId }),
    ]);

    return {
      deployments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get a single deployment by ID.
   */
  async getDeployment(deploymentId, tenantId) {
    const deployment = await Deployment.findById(deploymentId).populate('appId', 'name tenantId');
    if (!deployment) throw new AppError('Deployment not found', 404);

    // Authorization: verify deployment belongs to tenant
    if (deployment.appId?.tenantId?.toString() !== tenantId.toString()) {
      throw new AppError('Deployment not found', 404);
    }

    return deployment;
  },

  /**
   * Get deployment logs (full log array).
   */
  async getDeploymentLogs(deploymentId, tenantId) {
    const deployment = await this.getDeployment(deploymentId, tenantId);
    return deployment.logs;
  },

  /**
   * Stop a running deployment's container.
   */
  async stopDeployment(deploymentId, tenantId) {
    const deployment = await this.getDeployment(deploymentId, tenantId);

    if (deployment.status !== 'running') {
      throw new AppError('Deployment is not running', 400);
    }

    if (deployment.containerName) {
      await dockerService.stopContainer(deployment.containerName);
    }

    if (deployment.subdomain) {
      await nginxService.removeConfig(deployment.subdomain);
    }

    deployment.status = 'stopped';
    deployment.finishedAt = new Date();
    await deployment.save();

    // Clear active deployment reference on the app
    await App.findByIdAndUpdate(deployment.appId, { activeDeploymentId: null });

    logger.info(`[DeploymentService] Stopped deployment ${deploymentId}`);
    return deployment;
  },

  /**
   * Get queue position for a queued deployment (informational).
   */
  async getQueuePosition(deploymentId) {
    const { deploymentQueue } = await import('../config/queue.js');
    const waiting = await deploymentQueue.getWaiting();
    const idx = waiting.findIndex((j) => j.data?.deploymentId === deploymentId.toString());
    return idx >= 0 ? idx + 1 : null;
  },
};
