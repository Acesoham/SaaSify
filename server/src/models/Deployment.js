import mongoose from 'mongoose';

// ─── Log line sub-document ────────────────────────────────────────────────────
const logLineSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    message: { type: String, required: true },
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'stdout', 'stderr'],
      default: 'info',
    },
  },
  { _id: false }
);

// ─── Deployment Schema ────────────────────────────────────────────────────────
const deploymentSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Trigger info
    triggeredBy: {
      type: String,
      enum: ['webhook', 'manual', 'api'],
      default: 'manual',
    },

    // Git info
    branch: { type: String, default: 'main' },
    commitSha: { type: String, default: '' },
    commitMessage: { type: String, default: '' },
    commitAuthor: { type: String, default: '' },

    // State machine
    // queued → building → running
    //                   → failed
    //                   → stopped
    status: {
      type: String,
      enum: ['queued', 'building', 'running', 'failed', 'stopped', 'cancelled'],
      default: 'queued',
      index: true,
    },

    // Container info (populated after successful deploy)
    containerName: { type: String, default: '' },
    containerId: { type: String, default: '' },
    containerPort: { type: Number, default: null },
    subdomain: { type: String, default: '' },
    liveUrl: { type: String, default: '' },

    // Docker image tag
    imageTag: { type: String, default: '' },

    // Timing
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    duration: { type: Number, default: null }, // ms

    // Build logs — capped at 2000 lines to prevent doc bloat
    logs: {
      type: [logLineSchema],
      default: [],
    },

    // Error info on failure
    errorMessage: { type: String, default: '' },

    // BullMQ job ID for correlation
    jobId: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Most recent deployments per app
deploymentSchema.index({ appId: 1, createdAt: -1 });

// TTL — auto-delete deployment logs after 30 days
deploymentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// ─── Virtuals / helpers ───────────────────────────────────────────────────────
deploymentSchema.methods.addLog = function (message, level = 'info') {
  // Keep max 2000 log lines in memory per deployment
  if (this.logs.length >= 2000) this.logs.shift();
  this.logs.push({ message, level, timestamp: new Date() });
};

deploymentSchema.methods.finish = function (status, errorMessage = '') {
  this.status = status;
  this.finishedAt = new Date();
  this.duration = this.startedAt ? Date.now() - this.startedAt.getTime() : null;
  if (errorMessage) this.errorMessage = errorMessage;
};

export default mongoose.model('Deployment', deploymentSchema);
