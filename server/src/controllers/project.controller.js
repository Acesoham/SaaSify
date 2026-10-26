import { projectService } from '../services/project.service.js';
import ActivityLog from '../models/ActivityLog.js';
import Project from '../models/Project.js';
import App from '../models/App.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import { githubService } from '../services/github.service.js';

async function syncProjectRepoAccess({ tenantId, appId, targetUserId, action }) {
  if (!appId) {
    return { status: 'not_linked', message: 'No GitHub repository is linked to this project.' };
  }

  try {
    const app = await App.findOne({ _id: appId, tenantId, status: { $ne: 'deleted' } }).select('repoFullName userId');
    if (!app) return { status: 'app_missing', message: 'The connected GitHub repository is no longer available.' };

    const target = await User.findById(targetUserId).select('githubConnected githubUsername');
    if (!target?.githubConnected || !target.githubUsername) {
      return action === 'remove'
        ? { status: 'github_not_connected', message: 'Project access was removed, but GitHub access could not be revoked because this member has no connected GitHub account.' }
        : { status: 'github_not_connected', message: 'Project access was updated. This member must connect GitHub in DevOps before repository access can be granted.' };
    }
    const repositoryOwner = app.repoFullName.split('/')[0];
    const isRepositoryOwner = target.githubUsername.toLowerCase() === repositoryOwner.toLowerCase();

    if (action === 'remove') {
      const stillAssigned = await Project.exists({
        tenantId,
        appId,
        $or: [{ members: targetUserId }, { owner: targetUserId }],
      });
      if (stillAssigned || isRepositoryOwner || String(app.userId) === String(targetUserId)) {
        return { status: 'retained', message: 'Project access was removed; GitHub access remains because the member still needs this repository.' };
      }

      await githubService.removeCollaborator(app.userId, app.repoFullName, target.githubUsername);
      return { status: 'removed', message: `GitHub repository access was removed for @${target.githubUsername}.` };
    }

    if (isRepositoryOwner || String(app.userId) === String(targetUserId)) {
      return {
        status: 'already_has_access',
        message: isRepositoryOwner
          ? `@${target.githubUsername} owns this repository and already has access.`
          : `@${target.githubUsername} connected this repository and already has access.`,
      };
    }

    const { invitationCreated } = await githubService.addCollaborator(app.userId, app.repoFullName, target.githubUsername);
    return invitationCreated
      ? { status: 'invited', message: `GitHub sent @${target.githubUsername} an invitation to ${app.repoFullName}; they must accept it.` }
      : { status: 'already_has_access', message: `@${target.githubUsername} already has access to ${app.repoFullName}.` };
  } catch (error) {
    console.error(`[GitHub project access] Could not ${action} access:`, error.message);
    return {
      status: 'failed',
      message: `Project access was updated, but GitHub access could not be ${action === 'remove' ? 'removed' : 'granted'}: ${error.message}`,
    };
  }
}

export const projectController = {
  async getAll(req, res, next) {
    try {
      const result = await projectService.getAll(req.tenantId, req.query, req.userId, req.userRole);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.tenantId, req.userId, req.userRole);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const project = await projectService.create(req.validatedBody, req.tenantId, req.userId);
      const githubAccess = req.validatedBody.appId
        ? await Promise.all(project.members.map((member) => syncProjectRepoAccess({
            tenantId: req.tenantId,
            appId: req.validatedBody.appId,
            targetUserId: member._id,
            action: 'add',
          })))
        : [];

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.created',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name },
      });

      res.status(201).json({ success: true, data: project, githubAccess });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const previous = await projectService.getById(req.params.id, req.tenantId, req.userId, req.userRole, { requireMembership: true });
      const oldAppId = previous.appId?._id || previous.appId || null;
      const previousMemberIds = previous.members.map((member) => member._id || member);
      const appIdSubmitted = Object.prototype.hasOwnProperty.call(req.validatedBody, 'appId');
      const nextAppId = appIdSubmitted ? req.validatedBody.appId : oldAppId;
      const project = await projectService.update(req.params.id, req.validatedBody, req.tenantId, req.userId, req.userRole);
      const githubAccess = [];

      if (String(oldAppId || '') !== String(nextAppId || '')) {
        if (oldAppId && previous) {
          for (const memberId of previousMemberIds) {
            githubAccess.push(await syncProjectRepoAccess({
              tenantId: req.tenantId,
              appId: oldAppId,
              targetUserId: memberId,
              action: 'remove',
            }));
          }
        }
        if (nextAppId) {
          for (const member of project.members) {
            githubAccess.push(await syncProjectRepoAccess({
              tenantId: req.tenantId,
              appId: nextAppId,
              targetUserId: member._id,
              action: 'add',
            }));
          }
        }
      }

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.updated',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name },
      });

      res.json({ success: true, data: project, githubAccess });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const project = await projectService.remove(req.params.id, req.tenantId);
      const projectMemberIds = [...new Set([...project.members.map(String), String(project.owner)])];
      const githubAccess = project.appId
        ? await Promise.all(projectMemberIds.map((memberId) => syncProjectRepoAccess({
            tenantId: req.tenantId,
            appId: project.appId,
            targetUserId: memberId,
            action: 'remove',
          })))
        : [];
      const io = req.app.get('io');
      if (io) {
        const room = `project:${project._id}`;
        const sockets = await io.in(room).fetchSockets();
        await Promise.all(sockets.map((socket) => socket.leave(room)));
        for (const memberId of projectMemberIds) {
          io.to(`user:${memberId}`).emit('project:access_revoked', { projectId: String(project._id) });
        }
      }

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.deleted',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name },
      });

      res.json({ success: true, message: 'Project deleted', githubAccess });
    } catch (error) {
      next(error);
    }
  },

  async getMembers(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.tenantId, req.userId, req.userRole);
      res.json({ success: true, data: project.members });
    } catch (error) {
      next(error);
    }
  },

  async addMember(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

      const existingProject = await projectService.getById(req.params.id, req.tenantId, req.userId, req.userRole, { requireMembership: true });
      const wasAlreadyMember = existingProject.members.some(
        (member) => String(member._id || member) === String(userId)
      );

      // Verify user is a tenant member
      const membership = await Membership.findOne({ userId, tenantId: req.tenantId, inviteStatus: 'accepted' });
      if (!membership) return res.status(400).json({ success: false, message: 'User is not a tenant member' });

      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { $addToSet: { members: userId } },
        { new: true }
      ).populate('members', 'name email avatar');

      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const githubAccess = await syncProjectRepoAccess({
        tenantId: req.tenantId,
        appId: project.appId,
        targetUserId: userId,
        action: 'add',
      });

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.member_added',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name, addedUserId: userId },
      });

      if (!wasAlreadyMember) {
        await Notification.create({
          userId,
          type: 'project_added',
          title: 'Added to ' + project.name,
          message: (req.user?.name || 'A teammate') + ' added you to "' + project.name + '". You can now access its project tasks.',
          meta: { tenantId: req.tenantId, projectId: project._id },
        }).catch((error) => console.error('[Project notification] Could not notify member:', error.message));
      }

      if (req.app.get('io')) {
        req.app.get('io').to(`user:${userId}`).emit('project:access_granted', { projectId: String(project._id) });
      }
      res.json({ success: true, data: project.members, githubAccess });
    } catch (error) {
      next(error);
    }
  },

  async grantMemberRepoAccess(req, res, next) {
    try {
      const [project, membership] = await Promise.all([
        projectService.getById(req.params.id, req.tenantId, req.userId, req.userRole, { requireMembership: true }),
        Membership.findOne({ userId: req.params.userId, tenantId: req.tenantId, inviteStatus: 'accepted' }),
      ]);
      if (!membership) return res.status(400).json({ success: false, message: 'User is not a tenant member' });
      if (!project.members.some((member) => String(member._id || member) === req.params.userId)) {
        return res.status(404).json({ success: false, message: 'Project member not found' });
      }

      const githubAccess = await syncProjectRepoAccess({
        tenantId: req.tenantId,
        appId: project.appId?._id || project.appId,
        targetUserId: req.params.userId,
        action: 'add',
      });
      res.json({ success: true, data: githubAccess });
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.tenantId, req.userId, req.userRole, { requireMembership: true });
      if (String(project.owner?._id || project.owner) === String(req.params.userId)) {
        return res.status(400).json({ success: false, message: 'The project owner cannot be removed.' });
      }
      if (!project.members.some((member) => String(member._id || member) === req.params.userId)) {
        return res.status(404).json({ success: false, message: 'User is not a project member' });
      }

      const updated = await Project.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { $pull: { members: req.params.userId } },
        { new: true }
      ).populate('members', 'name email avatar');
      const githubAccess = await syncProjectRepoAccess({
        tenantId: req.tenantId,
        appId: project.appId?._id || project.appId,
        targetUserId: req.params.userId,
        action: 'remove',
      });
      if (req.app.get('io')) {
        const io = req.app.get('io');
        const room = `project:${project._id}`;
        const sockets = await io.in(room).fetchSockets();
        await Promise.all(
          sockets
            .filter((socket) => String(socket.data.userId || socket.userId) === req.params.userId)
            .map((socket) => socket.leave(room))
        );
        io.to(`user:${req.params.userId}`).emit('project:access_revoked', { projectId: String(project._id) });
      }

      await ActivityLog.create({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'project.member_removed',
        entityType: 'project',
        entityId: project._id,
        metadata: { projectName: project.name, removedUserId: req.params.userId },
      });

      res.json({ success: true, data: updated.members, githubAccess });
    } catch (error) {
      next(error);
    }
  },
};
