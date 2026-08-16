import { Router } from 'express';
import { handleGithubWebhook } from '../webhooks/github.webhook.js';

const router = Router();

/**
 * @swagger
 * /webhooks/github:
 *   post:
 *     tags: [Webhooks]
 *     summary: Receive GitHub push webhook events
 *     description: |
 *       This endpoint receives raw push events from GitHub.
 *       It uses HMAC-SHA256 signature verification (X-Hub-Signature-256).
 *       Do NOT add JSON body parsing middleware here — raw Buffer is required.
 *     responses:
 *       202:
 *         description: Webhook accepted and deployment queued
 *       401:
 *         description: Invalid webhook signature
 */
router.post(
  '/github',
  // Raw body parser — CRITICAL: must be applied BEFORE express.json() globally
  // We use express.raw() scoped to this route only
  (req, res, next) => {
    let data = [];
    req.on('data', (chunk) => data.push(chunk));
    req.on('end', () => {
      req.body = Buffer.concat(data);
      next();
    });
    req.on('error', next);
  },
  handleGithubWebhook
);

export default router;
