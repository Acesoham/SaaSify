import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saasify',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expire: process.env.JWT_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'webhook-secret',
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },

  docker: {
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    deployDir: process.env.DEPLOY_DIR || '/tmp/saasify-deployments',
    networkName: process.env.DOCKER_NETWORK || 'saasify-apps',
  },

  nginx: {
    configDir: process.env.NGINX_CONFIG_DIR || '/etc/nginx/conf.d',
    templateDir: process.env.NGINX_TEMPLATE_DIR || './src/nginx/templates',
  },

  deployment: {
    portRangeStart: parseInt(process.env.PORT_RANGE_START || '4000', 10),
    portRangeEnd: parseInt(process.env.PORT_RANGE_END || '5999', 10),
    baseDomain: process.env.BASE_DOMAIN || 'localhost',
    appPort: parseInt(process.env.APP_CONTAINER_PORT || '3000', 10),
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'saasify-32-char-encryption-key!!',
  },
};
