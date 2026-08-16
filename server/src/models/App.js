import mongoose from 'mongoose';
import crypto from 'crypto';
import config from '../config/env.js';

// ─── AES-256-GCM helpers for env var encryption ──────────────────────────────
const ALGO = 'aes-256-gcm';

function encryptValue(plaintext) {
  const key = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptValue(ciphertext) {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const key = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}

// ─── EnvVar sub-document ─────────────────────────────────────────────────────
const envVarSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    encryptedValue: { type: String, required: true }, // AES-256-GCM
  },
  { _id: false }
);

// ─── App Schema ───────────────────────────────────────────────────────────────
const appSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Identity
    name: {
      type: String,
      required: [true, 'App name is required'],
      trim: true,
      maxlength: 100,
    },

    // GitHub repo info
    repoFullName: {
      type: String,
      required: [true, 'Repository full name is required'], // e.g. "owner/repo"
      trim: true,
    },
    repoUrl: {
      type: String,
      required: true,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    githubRepoId: {
      type: Number,
    },

    // Webhook
    webhookId: {
      type: Number, // GitHub webhook ID, stored for deletion
    },
    webhookActive: {
      type: Boolean,
      default: false,
    },

    // Build config
    buildCommand: {
      type: String,
      default: 'npm install && npm run build',
    },
    startCommand: {
      type: String,
      default: 'npm start',
    },
    dockerfilePath: {
      type: String,
      default: 'Dockerfile',
    },
    rootDirectory: {
      type: String,
      default: '.',
    },

    // Runtime
    containerPort: {
      type: Number,
      default: 3000, // port inside the container
    },

    // Environment variables (AES-256-GCM encrypted values)
    envVars: [envVarSchema],

    // Status
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },

    // Live deployment reference
    activeDeploymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deployment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Instance helpers ─────────────────────────────────────────────────────────
appSchema.methods.setEnvVar = function (key, value) {
  const idx = this.envVars.findIndex((e) => e.key === key);
  const encryptedValue = encryptValue(value);
  if (idx >= 0) {
    this.envVars[idx].encryptedValue = encryptedValue;
  } else {
    this.envVars.push({ key, encryptedValue });
  }
};

appSchema.methods.getEnvVar = function (key) {
  const entry = this.envVars.find((e) => e.key === key);
  if (!entry) return null;
  return decryptValue(entry.encryptedValue);
};

appSchema.methods.getDecryptedEnvVars = function () {
  return this.envVars.reduce((acc, e) => {
    acc[e.key] = decryptValue(e.encryptedValue);
    return acc;
  }, {});
};

export default mongoose.model('App', appSchema);
