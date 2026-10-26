import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import { taskService } from '../services/task.service.js';
import { taskSubmissionService } from '../services/taskSubmission.service.js';

async function notifyWorkspaceAdmins(task, submission, submittedBy, submitterName) {
  try {
    const admins = await Membership.find({
      tenantId: task.tenantId,
      role: 'admin',
      inviteStatus: 'accepted',
      userId: { $ne: submittedBy },
    }).select('userId');

    await Promise.all(admins.map(({ userId }) => Notification.create({
      userId,
      type: 'general',
      title: `Work submitted for ${task.title}`,
      message: `${submitterName || 'A teammate'} submitted work for admin review.`,
      meta: {
        tenantId: task.tenantId,
        projectId: task.projectId?._id || task.projectId,
        taskId: task._id,
        submissionId: submission._id,
      },
    }).catch((error) => console.error('[Submission notification] Could not notify admin:', error.message))));
  } catch (error) {
    console.error('[Submission notification] Could not look up workspace admins:', error.message);
  }
}

export const taskSubmissionController = {
  async list(req, res, next) {
    try {
      const submissions = await taskSubmissionService.list(
        req.params.taskId,
        req.tenantId,
        req.userId,
        req.userRole
      );
      res.json({ success: true, data: submissions });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const task = await taskService.getById(req.params.taskId, req.tenantId, req.userId, req.userRole);
      const submission = await taskSubmissionService.create(
        req.params.taskId,
        req.tenantId,
        req.userId,
        req.userRole,
        req.body
      );

      await notifyWorkspaceAdmins(task, submission, req.userId, req.user?.name);
      const updatedTask = await taskService.getById(req.params.taskId, req.tenantId, req.userId, req.userRole);

      if (req.app.get('io')) {
        req.app.get('io').to(`project:${task.projectId?._id || task.projectId}`).emit('task:updated', updatedTask);
      }
      res.status(201).json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  },

  async downloadFile(req, res, next) {
    try {
      const file = await taskSubmissionService.getFile(
        req.params.submissionId,
        req.params.fileId,
        req.tenantId,
        req.userId,
        req.userRole
      );
      const fallbackName = file.name.replace(/[\r\n"\\;]/g, '_').replace(/[^\x20-\x7E]/g, '_');
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', file.size);
      res.setHeader('Content-Disposition', `attachment; filename="${fallbackName || 'download'}"`);
      res.send(file.content);
    } catch (error) {
      next(error);
    }
  },

  async review(req, res, next) {
    try {
      const { decision, comment } = req.body || {};
      const submission = await taskSubmissionService.review(
        req.params.submissionId,
        req.tenantId,
        req.userId,
        req.userRole,
        decision,
        comment
      );
      const task = await taskService.getById(submission.taskId, req.tenantId, req.userId, req.userRole);

      await Notification.create({
        userId: submission.submittedBy._id || submission.submittedBy,
        type: 'general',
        title: decision === 'approve' ? `Work approved: ${task.title}` : `Changes requested: ${task.title}`,
        message: decision === 'approve'
          ? 'Your submitted work was approved by the workspace admin.'
          : `The admin requested changes: ${comment}`,
        meta: {
          tenantId: req.tenantId,
          projectId: task.projectId?._id || task.projectId,
          taskId: task._id,
          submissionId: submission._id,
        },
      }).catch((error) => console.error('[Submission notification] Could not notify submitter:', error.message));

      if (req.app.get('io')) {
        req.app.get('io').to(`project:${task.projectId?._id || task.projectId}`).emit('task:updated', task);
      }
      res.json({ success: true, data: submission, task });
    } catch (error) {
      next(error);
    }
  },
};
