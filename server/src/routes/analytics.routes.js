import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';

const router = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard statistics
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', authenticate, tenantScope, analyticsController.getDashboard);

/**
 * @swagger
 * /analytics/productivity:
 *   get:
 *     tags: [Analytics]
 *     summary: Get productivity metrics
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Productivity data
 */
router.get('/productivity', authenticate, tenantScope, analyticsController.getProductivity);

/**
 * @swagger
 * /analytics/activity:
 *   get:
 *     tags: [Analytics]
 *     summary: Get recent activity log
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Activity feed
 */
router.get('/activity', authenticate, tenantScope, analyticsController.getActivity);

export default router;
