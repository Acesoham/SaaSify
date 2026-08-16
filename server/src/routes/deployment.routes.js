import { Router } from 'express';
import { deploymentController } from '../controllers/deployment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';

const router = Router();

router.use(authenticate, tenantScope);

/**
 * @swagger
 * /deployments/{appId}/list:
 *   get:
 *     tags: [Deployments]
 *     summary: List deployments for an app
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of deployments
 */
router.get('/:appId/list', deploymentController.listDeployments);

/**
 * @swagger
 * /deployments/{id}:
 *   get:
 *     tags: [Deployments]
 *     summary: Get a single deployment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deployment details
 */
router.get('/:id', deploymentController.getDeployment);

/**
 * @swagger
 * /deployments/{id}/logs:
 *   get:
 *     tags: [Deployments]
 *     summary: Get deployment log lines
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of log lines
 */
router.get('/:id/logs', deploymentController.getLogs);

/**
 * @swagger
 * /deployments/{id}/stop:
 *   post:
 *     tags: [Deployments]
 *     summary: Stop a running deployment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deployment stopped
 */
router.post('/:id/stop', deploymentController.stopDeployment);

export default router;
