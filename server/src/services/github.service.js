import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import User from '../models/User.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const ALGO = 'aes-256-gcm';

// ─── Encryption helpers (reused from App model) ───────────────────────────────
function encryptToken(plaintext) {
  const key = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptToken(ciphertext) {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const key = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}

// ─── Build an authenticated Octokit instance for a user ──────────────────────
export async function getOctokitForUser(userId) {
  const user = await User.findById(userId).select('+githubAccessToken');
  if (!user?.githubConnected || !user.githubAccessToken) {
    throw new AppError('GitHub account not connected', 403);
  }
  const token = decryptToken(user.githubAccessToken);
  return new Octokit({ auth: token });
}

// ─── Service ─────────────────────────────────────────────────────────────────
export const githubService = {
  /**
   * Build the GitHub OAuth authorization URL.
   * Uses a CSRF state token scoped to the user's session.
   */
  getAuthUrl(state, login) {
    const params = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: config.github.callbackUrl,
      scope: 'read:user user:email repo',
      state,
      prompt: 'consent',
    });
    if (login) {
      params.append('login', login);
    }
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },

  /**
   * Exchange the authorization code for an access token via GitHub API.
   */
  async exchangeCodeForToken(code) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new AppError(`GitHub OAuth error: ${data.error_description}`, 400);
    }

    return data.access_token;
  },

  /**
   * Fetch authenticated user's GitHub profile.
   */
  async getGithubUser(accessToken) {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  },

  /**
   * Connect GitHub account to an existing SaaSify user.
   * Encrypts the access token before persisting.
   */
  async connectGithubAccount(userId, accessToken) {
    const githubUser = await this.getGithubUser(accessToken);

    const encrypted = encryptToken(accessToken);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        githubAccessToken: encrypted,
        githubConnected: true,
        // Fill in avatar if not set
        ...(githubUser.avatar_url && { avatar: githubUser.avatar_url }),
      },
      { new: true }
    );

    return user;
  },

  /**
   * List repos accessible to the authenticated user.
   * Paginates up to 100 results per page.
   */
  async listUserRepos(userId, page = 1, perPage = 30) {
    try {
      const octokit = await getOctokitForUser(userId);
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: perPage,
        page,
        affiliation: 'owner,collaborator',
      });

      return data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.clone_url,
        sshUrl: repo.ssh_url,
        defaultBranch: repo.default_branch,
        description: repo.description,
        language: repo.language,
        updatedAt: repo.updated_at,
      }));
    } catch (err) {
      if (err.status === 401) {
        throw new AppError('GitHub token is invalid or expired. Please reconnect your account.', 401);
      }
      throw err;
    }
  },

  /**
   * List branches for a given repo.
   */
  async listRepoBranches(userId, owner, repo) {
    try {
      const octokit = await getOctokitForUser(userId);
      const { data } = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
      return data.map((b) => b.name);
    } catch (err) {
      if (err.status === 401) {
        throw new AppError('GitHub token is invalid or expired. Please reconnect your account.', 401);
      }
      throw err;
    }
  },

  /**
   * Register a webhook on the user's repo.
   * Returns the webhook ID (store in App model for future deletion).
   */
  async createWebhook(userId, owner, repo, webhookUrl, secret) {
    const octokit = await getOctokitForUser(userId);
    const { data } = await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret,
        insecure_ssl: '0',
      },
      events: ['push'],
      active: true,
    });
    return data.id;
  },

  /**
   * Delete a webhook from the user's repo.
   */
  async deleteWebhook(userId, owner, repo, webhookId) {
    try {
      const octokit = await getOctokitForUser(userId);
      await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: webhookId });
    } catch (err) {
      // Webhook may already be deleted — not a fatal error
      console.warn(`[GitHub] Could not delete webhook ${webhookId}:`, err.message);
    }
  },

  /**
   * Decrypt a user's stored GitHub access token.
   * Used internally by services that need raw API access.
   */
  async getDecryptedToken(userId) {
    const user = await User.findById(userId).select('+githubAccessToken');
    if (!user?.githubAccessToken) return null;
    return decryptToken(user.githubAccessToken);
  },
};
