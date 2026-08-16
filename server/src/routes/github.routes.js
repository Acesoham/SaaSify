import { Router } from 'express';
import { githubController } from '../controllers/github.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /github/auth-url:
 *   get:
 *     tags: [GitHub]
 *     summary: Get the GitHub OAuth authorization URL
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Returns the GitHub OAuth URL for the frontend to navigate to
 */
// Returns the OAuth URL as JSON — frontend navigates there.
// authenticate required so we can embed userId in the state token.
router.get('/auth-url', authenticate, githubController.getAuthUrl);

/**
 * @swagger
 * /github/callback:
 *   get:
 *     tags: [GitHub]
 *     summary: GitHub OAuth callback (called by GitHub redirect, no JWT)
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirects to frontend dashboard
 */
// NO authenticate here — this is a browser redirect FROM GitHub, no JWT present
router.get('/callback', githubController.handleCallback);

// All remaining routes require a valid JWT
router.use(authenticate);

/**
 * @swagger
 * /github/status:
 *   get:
 *     tags: [GitHub]
 *     summary: Get GitHub connection status for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: GitHub connection status
 */
router.get('/status', githubController.getStatus);

/**
 * @swagger
 * /github/disconnect:
 *   delete:
 *     tags: [GitHub]
 *     summary: Disconnect GitHub account
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: GitHub account disconnected
 */
router.delete('/disconnect', githubController.disconnect);

/**
 * @swagger
 * /github/repos:
 *   get:
 *     tags: [GitHub]
 *     summary: List GitHub repos accessible to the user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: per_page
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: List of repositories
 */
router.get('/repos', githubController.listRepos);

/**
 * @swagger
 * /github/repos/{owner}/{repo}/branches:
 *   get:
 *     tags: [GitHub]
 *     summary: List branches for a specific repository
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: repo
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of branch names
 */
router.get('/repos/:owner/:repo/branches', githubController.listBranches);

export default router;
