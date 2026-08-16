import App from '../models/App.js';
import Deployment from '../models/Deployment.js';
import { githubService } from './github.service.js';
import { deploymentQueue } from '../config/queue.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

export const appService = {
  /**
   * Connect a new GitHub repository as a deployable App.
   * Registers a GitHub webhook on the repo automatically.
   */
  async createApp({ userId, tenantId, name, repoFullName, defaultBranch, buildCommand, startCommand, rootDirectory, containerPort }) {
    // Prevent duplicate apps for same repo in same tenant
    const existing = await App.findOne({ tenantId, repoFullName, status: { $ne: 'deleted' } });
    if (existing) {
      throw new AppError('This repository is already connected in your workspace', 409);
    }

    const [owner, repo] = repoFullName.split('/');

    // Get repo details from GitHub
    let repoData;
    try {
      const { getOctokitForUser } = await import('./github.service.js');
      const octokit = await getOctokitForUser(userId);
      const { data } = await octokit.rest.repos.get({ owner, repo });
      repoData = data;
    } catch (err) {
      throw new AppError(`Cannot access repository: ${err.message}`, 400);
    }

    // Create the App record first (need ID for webhook URL)
    const app = await App.create({
      userId,
      tenantId,
      name: name || repoData.name,
      repoFullName,
      repoUrl: repoData.clone_url,
      defaultBranch: defaultBranch || repoData.default_branch,
      githubRepoId: repoData.id,
      buildCommand: buildCommand || 'npm install && npm run build',
      startCommand: startCommand || 'npm start',
      rootDirectory: rootDirectory || '.',
      containerPort: containerPort || config.deployment.appPort,
      webhookActive: false,
    });

    // Register GitHub webhook
    const webhookUrl = `${config.github.callbackUrl.replace('/api/github/callback', '')}/api/webhooks/github`;
    try {
      const webhookId = await githubService.createWebhook(
        userId,
        owner,
        repo,
        webhookUrl,
        config.github.webhookSecret
      );
      app.webhookId = webhookId;
      app.webhookActive = true;
      await app.save();

      logger.info(`[AppService] Webhook registered (id=${webhookId}) for ${repoFullName}`);
    } catch (err) {
      logger.warn(`[AppService] Webhook registration failed for ${repoFullName}: ${err.message}`);
      // App is still created — user can manually trigger deployments
    }

    return app;
  },

  /**
   * List all apps for a tenant.
   */
  async listApps(tenantId) {
    return App.find({ tenantId, status: { $ne: 'deleted' } })
      .populate('activeDeploymentId', 'status liveUrl finishedAt')
      .sort({ createdAt: -1 });
  },

  /**
   * Get a single app by ID, verifying tenant ownership.
   */
  async getApp(appId, tenantId) {
    const app = await App.findOne({ _id: appId, tenantId, status: { $ne: 'deleted' } }).populate(
      'activeDeploymentId'
    );
    if (!app) throw new AppError('App not found', 404);
    return app;
  },

  /**
   * Update environment variables for an app.
   * Accepts an array of { key, value } — merges with existing vars.
   */
  async updateEnvVars(appId, tenantId, envVars) {
    const app = await App.findOne({ _id: appId, tenantId });
    if (!app) throw new AppError('App not found', 404);

    for (const { key, value } of envVars) {
      if (!key || typeof value === 'undefined') continue;
      app.setEnvVar(key, String(value));
    }

    await app.save();
    // Return keys only — never return encrypted values over API
    return app.envVars.map((e) => e.key);
  },

  /**
   * Delete (soft) an app and clean up its webhook.
   */
  async deleteApp(appId, tenantId, userId) {
    const app = await App.findOne({ _id: appId, tenantId });
    if (!app) throw new AppError('App not found', 404);

    // Remove GitHub webhook
    if (app.webhookId && app.repoFullName) {
      const [owner, repo] = app.repoFullName.split('/');
      await githubService.deleteWebhook(userId, owner, repo, app.webhookId);
    }

    app.status = 'deleted';
    await app.save();

    return { message: `App "${app.name}" deleted` };
  },

  /**
   * Manually trigger a new deployment for an app.
   */
  async triggerDeployment(appId, tenantId, userId) {
    const app = await App.findOne({ _id: appId, tenantId, status: 'active' });
    if (!app) throw new AppError('App not found or not active', 404);

    const deployment = await Deployment.create({
      appId: app._id,
      userId,
      triggeredBy: 'manual',
      branch: app.defaultBranch,
      status: 'queued',
    });

    const job = await deploymentQueue.add(
      'deploy',
      {
        deploymentId: deployment._id.toString(),
        appId: app._id.toString(),
        userId: userId.toString(),
        branch: app.defaultBranch,
      },
      { jobId: `deploy-${deployment._id}` }
    );

    await Deployment.findByIdAndUpdate(deployment._id, { jobId: job.id });

    logger.info(`[AppService] Manual deployment triggered: ${deployment._id} for app ${app.name}`);
    return deployment;
  },
};
