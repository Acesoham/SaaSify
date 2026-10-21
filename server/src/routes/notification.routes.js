import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, notificationController.getAll);
router.post('/read-all', authenticate, notificationController.markAllRead);
router.post('/:id/read', authenticate, notificationController.markRead);
router.delete('/:id', authenticate, notificationController.deleteOne);

export default router;
