import mongoose from 'mongoose';

const submissionFileSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 300 },
  relativePath: { type: String, required: true, maxlength: 1000 },
  mimeType: { type: String, default: 'application/octet-stream', maxlength: 150 },
  size: { type: Number, required: true, min: 0 },
  content: { type: Buffer, required: true },
}, { _id: true });

const taskSubmissionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  note: { type: String, default: '', maxlength: 2000 },
  files: { type: [submissionFileSchema], required: true },
  status: {
    type: String,
    enum: ['submitted', 'approved', 'changes_requested'],
    default: 'submitted',
    index: true,
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewComment: { type: String, default: '', maxlength: 2000 },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

taskSubmissionSchema.index({ tenantId: 1, taskId: 1, createdAt: -1 });
taskSubmissionSchema.index(
  { tenantId: 1, taskId: 1 },
  { unique: true, partialFilterExpression: { status: 'submitted' } }
);

export default mongoose.model('TaskSubmission', taskSubmissionSchema);
