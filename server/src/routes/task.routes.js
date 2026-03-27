import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { rbac } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { taskSchema, taskUpdateSchema, commentSchema } from '../validators/schemas.js';

const router = Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [backlog, todo, in-progress, review, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/', authenticate, tenantScope, taskController.getAll);

/**
 * @swagger
 * /tasks/kanban:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks grouped by status (Kanban board)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Kanban board data
 */
router.get('/kanban', authenticate, tenantScope, taskController.getKanban);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Task details
 */
router.get('/:id', authenticate, tenantScope, taskController.getById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/', authenticate, tenantScope, rbac('admin', 'member'), validate(taskSchema), taskController.create);

router.put('/:id', authenticate, tenantScope, rbac('admin', 'member'), validate(taskUpdateSchema), taskController.update);
router.delete('/:id', authenticate, tenantScope, rbac('admin', 'member'), taskController.remove);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   get:
 *     tags: [Tasks]
 *     summary: Get comments for a task
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/:id/comments', authenticate, tenantScope, taskController.getComments);
router.post('/:id/comments', authenticate, tenantScope, validate(commentSchema), taskController.addComment);

export default router;
