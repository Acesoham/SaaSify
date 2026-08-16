import path from 'path';
import { mkdir, rm } from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import simpleGit from 'simple-git';
import Deployment from '../models/Deployment.js';
import App from '../models/App.js';
import { dockerService } from '../docker/docker.service.js';
import { portAllocator } from '../docker/portAllocator.js';
import { nginxService } from '../nginx/nginx.service.js';
import { githubService } from '../services/github.service.js';
import config from '../config/env.js';
import logger from '../config/logger.js';

// ─── Deployment Pipeline ──────────────────────────────────────────────────────

/**
 * The main deployment processor called by BullMQ.
 *
 * Job data shape:
 *   { deploymentId, appId, userId, branch, commitSha }
 *
 * Emits socket events to room `deployment:<deploymentId>`:
 *   - log:line       { message, level, timestamp }
 *   - status:change  { status }
 *   - deployment:live { url }
 */
export async function processDeployment(job) {
  const { deploymentId, appId, userId, branch, commitSha } = job.data;

  // ── Load records ──────────────────────────────────────────────────────────
  const [deployment, app] = await Promise.all([
    Deployment.findById(deploymentId),
    App.findById(appId),
  ]);

  if (!deployment || !app) {
    throw new Error(`Deployment or App not found: ${deploymentId}`);
  }

  // io instance is attached to global in index.js
  const io = global.io;

  // Helper: log a line, persist to DB, and emit to socket room
  async function log(message, level = 'info') {
    const entry = { message, level, timestamp: new Date() };
    deployment.logs.push(entry);

    // Throttle DB saves — write in batches of 10 lines
    if (deployment.logs.length % 10 === 0) {
      await Deployment.findByIdAndUpdate(deploymentId, { $push: { logs: { $each: [] } } });
    }

    io?.to(`deployment:${deploymentId}`).emit('log:line', entry);
    logger.info(`[Deploy:${deploymentId}] ${message}`);
  }

  async function setStatus(status) {
    deployment.status = status;
    await Deployment.findByIdAndUpdate(deploymentId, { status });
    io?.to(`deployment:${deploymentId}`).emit('status:change', { status });
    logger.info(`[Deploy:${deploymentId}] Status → ${status}`);
  }

  const workDir = path.join(config.docker.deployDir, deploymentId);
  let hostPort = null;
  let containerName = null;
  let imageTag = null;

  try {
    // ── STEP 1: Mark as building ──────────────────────────────────────────
    deployment.startedAt = new Date();
    await setStatus('building');
    await log('🚀 Deployment pipeline started');

    // ── STEP 2: Clone / pull the repository ──────────────────────────────
    await log(`📦 Cloning ${app.repoFullName}@${branch}`);
    await mkdir(workDir, { recursive: true });

    // Get a fresh GitHub token for this user
    const githubToken = await githubService.getDecryptedToken(userId);
    if (!githubToken) {
      throw new Error('GitHub account not connected. Please reconnect GitHub in Settings.');
    }

    // Authenticated clone URL
    const [repoOwner, repoName] = app.repoFullName.split('/');
    const cloneUrl = `https://${githubToken}@github.com/${app.repoFullName}.git`;

    const git = simpleGit();
    await git.clone(cloneUrl, workDir, ['--branch', branch, '--depth', '1']);
    await log(`✅ Repository cloned successfully`);

    // ── STEP 3: Write injected environment variables ──────────────────────
    if (app.envVars.length > 0) {
      await log('🔑 Injecting environment variables');
      const decrypted = app.getDecryptedEnvVars();
      const envContent = Object.entries(decrypted)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

      const envPath = path.join(workDir, app.rootDirectory || '.', '.env');
      writeFileSync(envPath, envContent, 'utf8');
      await log(`✅ ${Object.keys(decrypted).length} env vars written`);
    }

    // ── STEP 4: Ensure Docker network exists ─────────────────────────────
    await dockerService.ensureNetwork(config.docker.networkName);

    // ── STEP 5: Build Docker image ────────────────────────────────────────
    const shortSha = (commitSha || 'latest').slice(0, 7);
    imageTag = `saasify-${app._id.toString().slice(-6)}:${shortSha}`;
    const buildContext = path.join(workDir, app.rootDirectory || '.');

    await log(`🔨 Building Docker image: ${imageTag}`);

    await dockerService.buildImage(imageTag, buildContext, async (line, level) => {
      await log(line, level === 'stderr' ? 'stderr' : 'stdout');
    });

    await log(`✅ Docker image built: ${imageTag}`);

    // ── STEP 6: Allocate a host port ──────────────────────────────────────
    hostPort = await portAllocator.allocate();
    await log(`🔌 Allocated port: ${hostPort}`);

    // ── STEP 7: Stop previous container (if any) ─────────────────────────
    if (app.activeDeploymentId) {
      const prevDeployment = await Deployment.findById(app.activeDeploymentId);
      if (prevDeployment?.containerName) {
        await log(`🛑 Stopping previous container: ${prevDeployment.containerName}`);
        await dockerService.stopContainer(prevDeployment.containerName);
        await Deployment.findByIdAndUpdate(app.activeDeploymentId, { status: 'stopped' });
      }
      if (prevDeployment?.subdomain) {
        await nginxService.removeConfig(prevDeployment.subdomain);
      }
    }

    // ── STEP 8: Start the new container ──────────────────────────────────
    containerName = `saasify-${app._id.toString().slice(-6)}-${shortSha}`;
    const decryptedEnv = app.envVars.length > 0 ? app.getDecryptedEnvVars() : {};

    await log(`🐳 Starting container: ${containerName}`);
    const containerId = await dockerService.runContainer({
      name: containerName,
      image: imageTag,
      hostPort,
      containerPort: app.containerPort || config.deployment.appPort,
      network: config.docker.networkName,
      env: decryptedEnv,
    });

    await log(`✅ Container running (id: ${containerId.slice(0, 12)})`);

    // ── STEP 9: Generate Nginx config + reload ────────────────────────────
    const subdomain = nginxService.generateSubdomain(app.name, commitSha);
    await log(`🌐 Configuring reverse proxy: ${subdomain}.${config.deployment.baseDomain}`);

    await nginxService.writeConfig(subdomain, hostPort);
    const liveUrl = nginxService.getLiveUrl(subdomain);

    await log(`✅ Nginx configured — live at: ${liveUrl}`);

    // ── STEP 10: Persist final deployment state ───────────────────────────
    const now = new Date();
    deployment.status = 'running';
    deployment.containerName = containerName;
    deployment.containerId = containerId;
    deployment.containerPort = hostPort;
    deployment.imageTag = imageTag;
    deployment.subdomain = subdomain;
    deployment.liveUrl = liveUrl;
    deployment.finishedAt = now;
    deployment.duration = now.getTime() - deployment.startedAt.getTime();

    await deployment.save();

    // Update App's active deployment reference
    await App.findByIdAndUpdate(appId, { activeDeploymentId: deployment._id });

    // ── STEP 11: Emit success to dashboard ───────────────────────────────
    await log(`🎉 Deployment successful! Live at: ${liveUrl}`, 'info');
    io?.to(`deployment:${deploymentId}`).emit('deployment:live', {
      url: liveUrl,
      status: 'running',
      deploymentId,
    });

    logger.info(`[Deploy:${deploymentId}] ✅ Complete in ${deployment.duration}ms`);

  } catch (err) {
    logger.error(`[Deploy:${deploymentId}] ❌ Failed: ${err.message}`);

    // Persist failure state
    deployment.status = 'failed';
    deployment.finishedAt = new Date();
    deployment.errorMessage = err.message;
    if (deployment.startedAt) {
      deployment.duration = Date.now() - deployment.startedAt.getTime();
    }
    deployment.logs.push({
      message: `❌ Deployment failed: ${err.message}`,
      level: 'error',
      timestamp: new Date(),
    });
    await deployment.save();

    io?.to(`deployment:${deploymentId}`).emit('status:change', { status: 'failed', error: err.message });

    // Cleanup: remove built image to free disk space
    if (imageTag) {
      await dockerService.removeImage(imageTag).catch(() => {});
    }

    // Re-throw so BullMQ records the failure and handles retries
    throw err;

  } finally {
    // Always clean up the clone directory to save disk space
    if (existsSync(workDir)) {
      await rm(workDir, { recursive: true, force: true }).catch((e) => {
        logger.warn(`[Deploy:${deploymentId}] Could not clean work dir: ${e.message}`);
      });
    }
  }
}
