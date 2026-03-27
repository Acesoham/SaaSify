import { Router } from 'express';
import { tenantController } from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * /tenants/my:
 *   get:
 *     tags: [Tenants]
 *     summary: Get all tenants for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of user tenants
 */
router.get('/my', authenticate, tenantController.getMyTenants);

/**
 * @swagger
 * /tenants/current:
 *   get:
 *     tags: [Tenants]
 *     summary: Get current tenant details
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tenant details
 */
router.get('/current', authenticate, tenantScope, tenantController.getById);

/**
 * @swagger
 * /tenants/current:
 *   put:
 *     tags: [Tenants]
 *     summary: Update current tenant
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tenant updated
 */
router.put('/current', authenticate, tenantScope, rbac('admin'), tenantController.update);

/**
 * @swagger
 * /tenants/members:
 *   get:
 *     tags: [Tenants]
 *     summary: Get tenant members
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of members
 */
router.get('/members', authenticate, tenantScope, tenantController.getMembers);

router.delete('/members/:userId', authenticate, tenantScope, rbac('admin'), tenantController.removeMember);
router.put('/members/:userId/role', authenticate, tenantScope, rbac('admin'), tenantController.updateMemberRole);

export default router;
