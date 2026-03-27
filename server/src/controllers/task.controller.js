import { taskService } from '../services/task.service.js';
import ActivityLog from '../models/ActivityLog.js';

export const taskController = {
  async getAll(req, res, next) {
    try {
      const result = await taskService.getAll(req.tenantId, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const task = await taskService.getById(req.params.id, req.tenantId);
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const task = await taskService.create(req.validatedBody, req.tenantId, req.userId);

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'task.created',
        entityType: 'task',
        entityId: task._id,
        metadata: { taskTitle: task.title },
      });

      // Emit socket event
      if (req.app.get('io')) {
        req.app.get('io').to(`tenant:${req.tenantId}`).emit('task:created', task);
      }

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const oldTask = await taskService.getById(req.params.id, req.tenantId);
      const task = await taskService.update(req.params.id, req.validatedBody, req.tenantId);

      const action = req.validatedBody.status && req.validatedBody.status !== oldTask.status
        ? 'task.status_changed'
        : 'task.updated';

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action,
        entityType: 'task',
        entityId: task._id,
        metadata: {
          taskTitle: task.title,
          ...(action === 'task.status_changed' && {
            from: oldTask.status,
            to: task.status,
          }),
        },
      });

      if (req.app.get('io')) {
        req.app.get('io').to(`tenant:${req.tenantId}`).emit('task:updated', task);
      }

      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const task = await taskService.remove(req.params.id, req.tenantId);

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'task.deleted',
        entityType: 'task',
        entityId: task._id,
        metadata: { taskTitle: task.title },
      });

      if (req.app.get('io')) {
        req.app.get('io').to(`tenant:${req.tenantId}`).emit('task:deleted', { taskId: req.params.id });
      }

      res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
      next(error);
    }
  },

  async getKanban(req, res, next) {
    try {
      const columns = await taskService.getKanbanBoard(req.tenantId, req.query.projectId);
      res.json({ success: true, data: columns });
    } catch (error) {
      next(error);
    }
  },

  async addComment(req, res, next) {
    try {
      const comment = await taskService.addComment(
        req.params.id,
        req.tenantId,
        req.userId,
        req.validatedBody.content
      );

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'task.commented',
        entityType: 'comment',
        entityId: comment._id,
        metadata: { taskId: req.params.id },
      });

      if (req.app.get('io')) {
        req.app.get('io').to(`tenant:${req.tenantId}`).emit('task:commented', {
          taskId: req.params.id,
          comment,
        });
      }

      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  },

  async getComments(req, res, next) {
    try {
      const comments = await taskService.getComments(req.params.id, req.tenantId);
      res.json({ success: true, data: comments });
    } catch (error) {
      next(error);
    }
  },
};
