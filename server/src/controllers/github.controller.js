import crypto from 'crypto';
import { githubService } from '../services/github.service.js';
import config from '../config/env.js';

export const githubController = {
  /**
   * GET /api/github/auth-url
   * Returns the GitHub OAuth URL for the frontend to navigate to.
   * Requires authentication so we can embed userId in the state.
   */
  getAuthUrl(req, res) {
    // CSRF protection: state = base64url(userId + randomNonce)
    const state = Buffer.from(
      JSON.stringify({ userId: req.userId.toString(), nonce: crypto.randomBytes(8).toString('hex') })
    ).toString('base64url');

    const { login } = req.query;
    const url = githubService.getAuthUrl(state, login);
    // Return as JSON — frontend navigates there via window.location.href
    res.json({ success: true, data: { url } });
  },

  /**
   * GET /api/github/callback
   * Receives GitHub OAuth callback from the browser (no JWT — browser redirect).
   * Extracts userId from the signed state token embedded during /auth-url.
   */
  async handleCallback(req, res) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${config.clientUrl}/devops?error=github_oauth_denied`);
      }

      if (!code || !state) {
        return res.redirect(`${config.clientUrl}/devops?error=invalid_callback`);
      }

      // Decode userId from the state we generated in /auth-url
      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      } catch {
        return res.redirect(`${config.clientUrl}/devops?error=invalid_state`);
      }

      if (!stateData.userId) {
        return res.redirect(`${config.clientUrl}/devops?error=invalid_state`);
      }

      // Exchange code for access token
      const accessToken = await githubService.exchangeCodeForToken(code);

      // Connect GitHub account to the user from the state
      await githubService.connectGithubAccount(stateData.userId, accessToken);

      // Redirect back to frontend with success
      res.redirect(`${config.clientUrl}/devops?github=connected`);
    } catch (err) {
      console.error('[GitHub OAuth] Callback error:', err);
      res.redirect(`${config.clientUrl}/devops?error=github_oauth_failed`);
    }
  },

  /**
   * GET /api/github/status
   * Returns whether the current user has GitHub connected.
   */
  async getStatus(req, res) {
    const user = req.user;
    res.json({
      success: true,
      data: {
        connected: user.githubConnected || false,
        username: user.githubUsername || null,
      },
    });
  },

  /**
   * DELETE /api/github/disconnect
   * Removes GitHub connection from user account.
   */
  async disconnect(req, res, next) {
    try {
      await req.user.updateOne({
        githubConnected: false,
        githubAccessToken: null,
        githubId: null,
        githubUsername: null,
      });
      res.json({ success: true, message: 'GitHub account disconnected' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/github/repos
   * Lists repos accessible to the authenticated user.
   */
  async listRepos(req, res, next) {
    try {
      const { page = 1, per_page = 30 } = req.query;
      const repos = await githubService.listUserRepos(req.userId, Number(page), Number(per_page));
      res.json({ success: true, data: repos });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/github/repos/:owner/:repo/branches
   * Lists branches for a specific repo.
   */
  async listBranches(req, res, next) {
    try {
      const { owner, repo } = req.params;
      const branches = await githubService.listRepoBranches(req.userId, owner, repo);
      res.json({ success: true, data: branches });
    } catch (err) {
      next(err);
    }
  },
};
