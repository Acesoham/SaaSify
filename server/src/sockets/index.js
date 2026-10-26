import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import logger from '../config/logger.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Membership from '../models/Membership.js';

export const initializeSocket = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    logger.info(`Socket connected: ${socket.userId}`);

    // Project rooms are authorized from stored membership, never from client-supplied tenant IDs.
    socket.on('join:project', async (projectId) => {
      try {
        const project = await Project.findById(projectId).select('tenantId owner members');
        if (!project) return;

        const membership = await Membership.findOne({
          userId: socket.userId,
          tenantId: project.tenantId,
          inviteStatus: 'accepted',
        }).select('role');
        if (!membership) return;

        const isProjectMember = project.members.some((memberId) => String(memberId) === String(socket.userId))
          || String(project.owner) === String(socket.userId);
        const isTaskAssignee = await Task.exists({
          tenantId: project.tenantId,
          projectId,
          assignees: socket.userId,
        });
        if (membership.role === 'admin' || isProjectMember || isTaskAssignee) {
          socket.join(`project:${projectId}`);
        }
      } catch (error) {
        logger.warn(`Could not authorize project socket room for ${socket.userId}: ${error.message}`);
      }
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Notification events
    socket.on('notification:read', (data) => {
      socket.emit('notification:updated', data);
    });

    // ─── Deployment log streaming ──────────────────────────────────────────
    // Client joins this room to receive live build logs + status changes
    socket.on('deployment:subscribe', (deploymentId) => {
      const room = `deployment:${deploymentId}`;
      socket.join(room);
      logger.debug(`User ${socket.userId} subscribed to deployment: ${deploymentId}`);
    });

    socket.on('deployment:unsubscribe', (deploymentId) => {
      const room = `deployment:${deploymentId}`;
      socket.leave(room);
      logger.debug(`User ${socket.userId} unsubscribed from deployment: ${deploymentId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};
