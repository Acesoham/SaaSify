import { projectService } from '../services/project.service.js';
import ActivityLog from '../models/ActivityLog.js';

export const projectController = {
  async getAll(req, res, next) {
    try {
      const result = await projectService.getAll(req.tenantId, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.tenantId);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const project = await projectService.create(req.validatedBody, req.tenantId, req.userId);

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.created',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name },
      });

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const project = await projectService.update(req.params.id, req.validatedBody, req.tenantId);

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.updated',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name },
      });

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const project = await projectService.remove(req.params.id, req.tenantId);

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.deleted',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name },
      });

      res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
      next(error);
    }
  },
};
