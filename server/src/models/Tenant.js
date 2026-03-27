import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    settings: {
      logo: { type: String, default: '' },
      primaryColor: { type: String, default: '#6C5CE7' },
      timezone: { type: String, default: 'UTC' },
      features: {
        kanban: { type: Boolean, default: true },
        analytics: { type: Boolean, default: true },
        devops: { type: Boolean, default: false },
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

tenantSchema.pre('save', function (next) {
  if (!this.tenantId) {
    this.tenantId = this._id;
  }
  next();
});

export default mongoose.model('Tenant', tenantSchema);
