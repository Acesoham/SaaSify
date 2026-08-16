import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import config from '../config/env.js';
import logger from '../config/logger.js';

const execAsync = promisify(exec);

/**
 * Docker service — wraps Docker CLI via exec().
 *
 * Why CLI over Dockerode?
 *  - Zero native binding issues across OS/arch
 *  - Easier log streaming via child_process.spawn
 *  - Same commands ops teams use directly
 *
 * On EC2: the server process needs access to /var/run/docker.sock
 * In Docker: mount -v /var/run/docker.sock:/var/run/docker.sock
 */
export const dockerService = {
  /**
   * Build a Docker image from a directory.
   * Streams stdout/stderr line-by-line to the onLog callback.
   *
   * @param {string} tag - Image tag (e.g. "saasify-abc123:sha")
   * @param {string} contextPath - Build context directory path
   * @param {Function} onLog - Called with (line: string, level: 'stdout'|'stderr')
   */
  buildImage(tag, contextPath, onLog) {
    return new Promise((resolve, reject) => {
      const proc = spawn('docker', [
        'build',
        '--tag', tag,
        '--file', path.join(contextPath, 'Dockerfile'),
        contextPath,
      ]);

      proc.stdout.on('data', (chunk) => {
        chunk.toString().split('\n').filter(Boolean).forEach((line) => {
          onLog?.(line, 'stdout');
        });
      });

      proc.stderr.on('data', (chunk) => {
        chunk.toString().split('\n').filter(Boolean).forEach((line) => {
          // Docker sends progress to stderr — not actual errors
          onLog?.(line, 'stderr');
        });
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(tag);
        } else {
          reject(new Error(`docker build exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  },

  /**
   * Run a container in detached mode.
   * Returns the container ID.
   *
   * @param {object} opts
   * @param {string} opts.name - Container name
   * @param {string} opts.image - Image tag
   * @param {number} opts.hostPort - Port on the host
   * @param {number} opts.containerPort - Port inside the container
   * @param {string} opts.network - Docker network name
   * @param {Object} opts.env - Environment variables { KEY: value }
   */
  async runContainer({ name, image, hostPort, containerPort, network, env = {} }) {
    // Build env args
    const envArgs = Object.entries(env)
      .flatMap(([k, v]) => ['-e', `${k}=${v}`]);

    const args = [
      'run', '--detach',
      '--name', name,
      '--restart', 'unless-stopped',
      '-p', `${hostPort}:${containerPort}`,
      '--network', network,
      ...envArgs,
      image,
    ];

    const { stdout } = await execAsync(`docker ${args.map(a => `"${a}"`).join(' ')}`);
    const containerId = stdout.trim();
    logger.info(`[Docker] Container started: ${name} (${containerId.slice(0, 12)})`);
    return containerId;
  },

  /**
   * Stop and remove a container by name.
   * Safe to call even if the container doesn't exist.
   */
  async stopContainer(name) {
    try {
      await execAsync(`docker stop "${name}"`);
      await execAsync(`docker rm "${name}"`);
      logger.info(`[Docker] Container stopped and removed: ${name}`);
    } catch (err) {
      // Container may not exist — log and continue
      logger.warn(`[Docker] Could not stop container "${name}": ${err.message}`);
    }
  },

  /**
   * Remove a Docker image (used for cleanup after failed builds).
   */
  async removeImage(tag) {
    try {
      await execAsync(`docker rmi "${tag}" --force`);
      logger.info(`[Docker] Image removed: ${tag}`);
    } catch (err) {
      logger.warn(`[Docker] Could not remove image "${tag}": ${err.message}`);
    }
  },

  /**
   * Ensure the SaaSify app network exists.
   */
  async ensureNetwork(networkName) {
    try {
      await execAsync(`docker network inspect "${networkName}"`);
    } catch {
      await execAsync(`docker network create "${networkName}"`);
      logger.info(`[Docker] Network created: ${networkName}`);
    }
  },

  /**
   * Check if a container is running.
   */
  async isContainerRunning(name) {
    try {
      const { stdout } = await execAsync(
        `docker inspect --format="{{.State.Running}}" "${name}"`
      );
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Get container resource stats (CPU%, Memory).
   * Returns null if container isn't running.
   */
  async getContainerStats(name) {
    try {
      const { stdout } = await execAsync(
        `docker stats "${name}" --no-stream --format "{{.CPUPerc}},{{.MemUsage}}"`
      );
      const [cpu, mem] = stdout.trim().split(',');
      return { cpu, memory: mem };
    } catch {
      return null;
    }
  },
};
