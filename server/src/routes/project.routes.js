import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { rbac } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { projectSchema } from '../validators/schemas.js';

const router = Router();

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Get all projects
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, archived, completed] }
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', authenticate, tenantScope, projectController.getAll);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:id', authenticate, tenantScope, projectController.getById);

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/', authenticate, tenantScope, rbac('admin', 'member'), validate(projectSchema), projectController.create);

router.put('/:id', authenticate, tenantScope, rbac('admin', 'member'), validate(projectSchema), projectController.update);
router.delete('/:id', authenticate, tenantScope, rbac('admin'), projectController.remove);

export default router;
