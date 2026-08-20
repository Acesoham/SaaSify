import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { rbac } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, inviteSchema } from '../validators/schemas.js';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user and create tenant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, tenantName]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               tenantName: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/google/url:
 *   get:
 *     tags: [Auth]
 *     summary: Get Google OAuth URL
 *     responses:
 *       200:
 *         description: Google OAuth URL
 */
router.get('/google/url', authController.getGoogleAuthUrl);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth Callback
 *     responses:
 *       302:
 *         description: Redirects to frontend
 */
router.get('/google/callback', authController.handleGoogleCallback);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', authenticate, authController.me);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/invite:
 *   post:
 *     tags: [Auth]
 *     summary: Invite user to tenant
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Invitation sent
 */
router.post('/invite', authenticate, tenantScope, rbac('admin'), validate(inviteSchema), authController.invite);

/**
 * @swagger
 * /auth/invite/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Get invitation details
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation details
 */
/**
 * @swagger
 * /auth/accept-invite/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Accept tenant invitation
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invite accepted
 */
router.get('/invite/:token', authController.getInviteDetails);
router.post('/accept-invite/:token', authController.acceptInvite);

export default router;
