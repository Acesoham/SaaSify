import { Queue, QueueEvents } from 'bullmq';
import config from './env.js';
import logger from './logger.js';

// ─── Redis connection options ─────────────────────────────────────────────────
export const redisConnection = {
  url: config.redis.url,
  // Retry strategy: attempt reconnect up to 20 times with delay
  // After that, stop retrying so the process doesn't spam logs forever
  retryStrategy: (times) => {
    if (times > 20) return null; // stop retrying
    return Math.min(times * 500, 5000); // backoff up to 5s
  },
  maxRetriesPerRequest: null, // required by BullMQ
  enableOfflineQueue: false,
};

// ─── Lazy queue factory ───────────────────────────────────────────────────────
// We don't instantiate at module load time — this prevents the server from
// crashing on startup when Redis isn't available in local dev.
let _deploymentQueue = null;

export function getDeploymentQueue() {
  if (!_deploymentQueue) {
    _deploymentQueue = new Queue('deployments', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 60 * 60 * 24, count: 100 },
        removeOnFail: { age: 60 * 60 * 24 * 7 },
      },
    });

    _deploymentQueue.on('error', (err) => {
      logger.error(`[Queue] Redis connection error: ${err.message}`);
    });
  }
  return _deploymentQueue;
}

// ─── Backwards-compatible export for code that imports deploymentQueue directly
// This is a Proxy that lazily initializes the queue on first use
export const deploymentQueue = new Proxy({}, {
  get(_, prop) {
    return getDeploymentQueue()[prop];
  },
});

