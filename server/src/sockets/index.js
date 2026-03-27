import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import logger from '../config/logger.js';

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
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId}`);

    // Join tenant room
    socket.on('join:tenant', (tenantId) => {
      socket.join(`tenant:${tenantId}`);
      logger.debug(`User ${socket.userId} joined tenant room: ${tenantId}`);
    });

    // Leave tenant room
    socket.on('leave:tenant', (tenantId) => {
      socket.leave(`tenant:${tenantId}`);
    });

    // Task events
    socket.on('task:move', (data) => {
      socket.to(`tenant:${data.tenantId}`).emit('task:moved', data);
    });

    // Notification events
    socket.on('notification:read', (data) => {
      socket.emit('notification:updated', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};
