import Deployment from '../models/Deployment.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Allocates an available TCP port from the configured range.
 *
 * Strategy:
 *  1. Query MongoDB for all ports currently used by running deployments.
 *  2. Find the lowest port in [portRangeStart, portRangeEnd] not in that set.
 *
 * This approach is restart-safe — it survives server restarts unlike in-memory sets.
 */
export const portAllocator = {
  async allocate() {
    const { portRangeStart, portRangeEnd } = config.deployment;

    // Get all ports currently allocated to running or building deployments
    const activePorts = await Deployment.find(
      {
        status: { $in: ['building', 'running'] },
        containerPort: { $ne: null },
      },
      'containerPort'
    ).lean();

    const usedPorts = new Set(activePorts.map((d) => d.containerPort));

    // Linear scan — fine for ranges < 2000 ports
    for (let port = portRangeStart; port <= portRangeEnd; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }

    throw new AppError(
      `Port pool exhausted. All ports ${portRangeStart}-${portRangeEnd} are in use.`,
      503
    );
  },
};
