import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['invite', 'task_assigned', 'project_added', 'general'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    // For invite notifications — store the token so the user can accept in-app
    meta: {
      inviteToken: { type: String },
      tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
      tenantName: { type: String },
      inviterName: { type: String },
      role: { type: String },
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
