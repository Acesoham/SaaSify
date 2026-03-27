import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'task.created',
        'task.updated',
        'task.deleted',
        'task.status_changed',
        'task.assigned',
        'task.commented',
        'project.created',
        'project.updated',
        'project.deleted',
        'member.invited',
        'member.joined',
        'member.removed',
        'tenant.updated',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['task', 'project', 'member', 'tenant', 'comment'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
