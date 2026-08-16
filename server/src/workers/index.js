/**
 * Worker entry point.
 *
 * This file is run as a SEPARATE PROCESS from the API server:
 *   node src/workers/index.js
 *
 * In docker-compose, this is the `worker` service.
 * Keeping it separate means:
 *   - Deployment failures don't crash the API
 *   - Workers can be scaled independently
 *   - Long-running builds don't block HTTP requests
 */

import '../config/env.js'; // Load dotenv first
import connectDB from '../config/db.js';
import { redisConnection } from '../config/queue.js';
import { Worker } from 'bullmq';
import { processDeployment } from './deployment.worker.js';
import logger from '../config/logger.js';

// Connect to MongoDB (worker needs it for DB reads/writes)
await connectDB();

// ─── Register deployment worker ───────────────────────────────────────────────
const deploymentWorker = new Worker(
  'deployments',
  async (job) => {
    logger.info(`[Worker] Processing job ${job.id}: ${JSON.stringify(job.data)}`);
    return processDeployment(job);
  },
  {
    connection: redisConnection,
    concurrency: 3, // max 3 concurrent deployments
    limiter: {
      max: 10,
      duration: 60000, // max 10 jobs per minute
    },
  }
);

deploymentWorker.on('completed', (job) => {
  logger.info(`[Worker] ✅ Job ${job.id} completed`);
});

deploymentWorker.on('failed', (job, err) => {
  logger.error(`[Worker] ❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
});

deploymentWorker.on('stalled', (jobId) => {
  logger.warn(`[Worker] ⚠️ Job ${jobId} stalled — will be retried`);
});

logger.info('🔧 Deployment worker started. Waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('[Worker] SIGTERM received — closing worker gracefully');
  await deploymentWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('[Worker] SIGINT received — closing worker gracefully');
  await deploymentWorker.close();
  process.exit(0);
});
