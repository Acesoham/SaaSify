import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
    },
    inviteToken: {
      type: String,
      default: null,
    },
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'accepted',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);
