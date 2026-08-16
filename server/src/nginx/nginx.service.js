import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import logger from '../config/logger.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load and cache the Nginx config template.
 */
function getTemplate() {
  const templatePath = path.join(__dirname, 'templates', 'app.conf.template');
  return readFileSync(templatePath, 'utf8');
}

/**
 * Render the template with the given variables.
 * Simple {{key}} substitution — no full template engine needed.
 */
function renderTemplate(vars) {
  let template = getTemplate();
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }
  return template;
}

export const nginxService = {
  /**
   * Generate and write an Nginx config file for a deployment.
   *
   * @param {string} subdomain - e.g. "my-app-abc123"
   * @param {number} port - Host port the container is bound to
   * @param {string} [baseDomain] - Override for base domain
   */
  async writeConfig(subdomain, port, baseDomain = config.deployment.baseDomain) {
    const configContent = renderTemplate({ subdomain, port, baseDomain });
    const configPath = path.join(config.nginx.configDir, `${subdomain}.conf`);

    writeFileSync(configPath, configContent, 'utf8');
    logger.info(`[Nginx] Config written: ${configPath}`);

    await this.reloadNginx();

    return configPath;
  },

  /**
   * Remove the Nginx config for a deployment and reload.
   */
  async removeConfig(subdomain) {
    const configPath = path.join(config.nginx.configDir, `${subdomain}.conf`);

    if (existsSync(configPath)) {
      unlinkSync(configPath);
      logger.info(`[Nginx] Config removed: ${configPath}`);
      await this.reloadNginx();
    }
  },

  /**
   * Reload Nginx gracefully.
   *
   * Requires: sudo visudo entry:
   *   www-data ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload
   * Or run the server as a user with nginx reload privileges.
   *
   * Falls back to a no-op in development (NODE_ENV !== 'production').
   */
  async reloadNginx() {
    if (config.nodeEnv !== 'production') {
      logger.info('[Nginx] Skipping reload in non-production environment');
      return;
    }

    try {
      await execAsync('sudo nginx -s reload');
      logger.info('[Nginx] Reloaded successfully');
    } catch (err) {
      logger.error(`[Nginx] Reload failed: ${err.message}`);
      throw err;
    }
  },

  /**
   * Test Nginx config syntax without reloading.
   * Useful for pre-flight validation.
   */
  async testConfig() {
    const { stdout, stderr } = await execAsync('nginx -t 2>&1');
    return stdout + stderr;
  },

  /**
   * Generate the live URL for a deployment.
   */
  getLiveUrl(subdomain, baseDomain = config.deployment.baseDomain) {
    if (baseDomain === 'localhost') {
      return `http://${subdomain}.${baseDomain}`;
    }
    return `https://${subdomain}.${baseDomain}`;
  },

  /**
   * Generate a unique, URL-safe subdomain for an app deployment.
   * Format: <appName>-<shortSha>
   */
  generateSubdomain(appName, commitSha = '') {
    const safeName = appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 20);
    const shortSha = commitSha.slice(0, 7) || Date.now().toString(36);
    return `${safeName}-${shortSha}`;
  },
};
