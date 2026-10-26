import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import config from './config/env.js';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './sockets/index.js';

import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import githubRoutes from './routes/github.routes.js';
import appRoutes from './routes/app.routes.js';
import deploymentRoutes from './routes/deployment.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initializeSocket(io);
app.set('io', io);
// Expose io globally so the deployment worker can emit events
global.io = io;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow local dev, configured CLIENT_URL, and any ngrok tunnel
    const allowed = [
      config.clientUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    if (!origin || allowed.includes(origin) || /https?:\/\/.*\.ngrok(|-free)\.app$/.test(origin) || /https?:\/\/.*\.ngrok\.io$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow all in dev — tighten in production
    }
  },
  credentials: true,
}));

// Trust proxy for ngrok / reverse proxies
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // disable strict X-Forwarded-For validation (needed for ngrok)
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SaaSify API Docs',
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── PaaS Platform Routes ─────────────────────────────────────────────────────
// Webhooks MUST be registered before any global body parsers
app.use('/api/webhooks', webhookRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/deployments', deploymentRoutes);

// Error handling
app.use(errorHandler);

// Start
const start = async () => {
  await connectDB();

  httpServer.listen(config.port, () => {
    logger.info(`🚀 SaaSify API running on port ${config.port}`);
    logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
    logger.info(`🔧 Environment: ${config.nodeEnv}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
