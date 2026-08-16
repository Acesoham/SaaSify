import { Router } from 'express';
import { appController } from '../controllers/app.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';

const router = Router();

// All app routes require authentication + tenant scoping
router.use(authenticate, tenantScope);

/**
 * @swagger
 * /apps:
 *   post:
 *     tags: [Apps]
 *     summary: Connect a GitHub repository as a deployable app
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [repoFullName]
 *             properties:
 *               name: { type: string }
 *               repoFullName: { type: string, example: "owner/repo" }
 *               defaultBranch: { type: string, example: "main" }
 *               buildCommand: { type: string }
 *               startCommand: { type: string }
 *               rootDirectory: { type: string }
 *               containerPort: { type: integer }
 *     responses:
 *       201:
 *         description: App connected successfully
 */
router.post('/', appController.createApp);

/**
 * @swagger
 * /apps:
 *   get:
 *     tags: [Apps]
 *     summary: List all apps in the current tenant
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of apps
 */
router.get('/', appController.listApps);

/**
 * @swagger
 * /apps/{id}:
 *   get:
 *     tags: [Apps]
 *     summary: Get app details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: App details
 */
router.get('/:id', appController.getApp);

/**
 * @swagger
 * /apps/{id}/envvars:
 *   patch:
 *     tags: [Apps]
 *     summary: Set environment variables for an app
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               envVars:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key: { type: string }
 *                     value: { type: string }
 *     responses:
 *       200:
 *         description: Env vars updated (returns keys only, never values)
 */
router.patch('/:id/envvars', appController.updateEnvVars);

/**
 * @swagger
 * /apps/{id}:
 *   delete:
 *     tags: [Apps]
 *     summary: Disconnect and delete an app
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: App deleted
 */
router.delete('/:id', appController.deleteApp);

/**
 * @swagger
 * /apps/{id}/deploy:
 *   post:
 *     tags: [Apps]
 *     summary: Manually trigger a deployment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       202:
 *         description: Deployment queued
 */
router.post('/:id/deploy', appController.triggerDeployment);

export default router;
