import crypto from 'crypto';
import App from '../models/App.js';
import Deployment from '../models/Deployment.js';
import { deploymentQueue } from '../config/queue.js';
import config from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Verify GitHub webhook HMAC-SHA256 signature.
 * GitHub sends: X-Hub-Signature-256: sha256=<hex>
 */
function verifySignature(payload, signature) {
  if (!signature) return false;
  const expected = `sha256=${crypto
    .createHmac('sha256', config.github.webhookSecret)
    .update(payload)
    .digest('hex')}`;
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Handle incoming GitHub webhook POST.
 * This is called with raw body (Buffer) — JSON.parse is done here manually.
 */
export async function handleGithubWebhook(req, res) {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];

  // req.body is a Buffer (raw middleware applied in router)
  const rawBody = req.body;

  // ── 1. Signature verification ────────────────────────────────────────────
  if (!verifySignature(rawBody, signature)) {
    logger.warn(`[Webhook] Invalid signature for delivery ${deliveryId}`);
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }

  // ── 2. Acknowledge immediately (GitHub expects < 10s response) ────────────
  res.status(202).json({ success: true, message: 'Webhook received' });

  // ── 3. Parse payload ──────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    logger.error('[Webhook] Failed to parse payload');
    return;
  }

  logger.info(`[Webhook] Event: ${event}, Delivery: ${deliveryId}`);

  // ── 4. Handle push events only ────────────────────────────────────────────
  if (event !== 'push') return;
  if (payload.deleted) return; // Branch deletion, skip

  const repoFullName = payload.repository?.full_name;
  const branch = payload.ref?.replace('refs/heads/', '');
  const commitSha = payload.after;
  const commitMessage = payload.head_commit?.message || '';
  const commitAuthor = payload.head_commit?.author?.name || '';

  if (!repoFullName || !branch || !commitSha) {
    logger.warn('[Webhook] Push event missing required fields');
    return;
  }

  // ── 5. Find matching App(s) ───────────────────────────────────────────────
  const apps = await App.find({
    repoFullName,
    defaultBranch: branch,
    status: 'active',
    webhookActive: true,
  });

  if (apps.length === 0) {
    logger.info(`[Webhook] No active apps for ${repoFullName}@${branch}`);
    return;
  }

  // ── 6. Create Deployment records + enqueue jobs ───────────────────────────
  for (const app of apps) {
    try {
      const deployment = await Deployment.create({
        appId: app._id,
        userId: app.userId,
        triggeredBy: 'webhook',
        branch,
        commitSha,
        commitMessage,
        commitAuthor,
        status: 'queued',
      });

      const job = await deploymentQueue.add(
        'deploy',
        {
          deploymentId: deployment._id.toString(),
          appId: app._id.toString(),
          userId: app.userId.toString(),
          commitSha,
          branch,
        },
        {
          jobId: `deploy-${deployment._id}`,
        }
      );

      // Store BullMQ job ID on the deployment
      await Deployment.findByIdAndUpdate(deployment._id, { jobId: job.id });

      logger.info(
        `[Webhook] Queued deployment ${deployment._id} for app ${app.name} (${repoFullName}@${branch})`
      );
    } catch (err) {
      logger.error(`[Webhook] Failed to queue deployment for app ${app._id}:`, err);
    }
  }
}
