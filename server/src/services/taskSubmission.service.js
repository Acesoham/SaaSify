import Task from '../models/Task.js';
import TaskSubmission from '../models/TaskSubmission.js';
import { AppError } from '../middleware/errorHandler.js';
import { projectService } from './project.service.js';
import { taskService } from './task.service.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 8 * 1024 * 1024;
const MAX_FILE_COUNT = 100;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function decodeSubmittedFiles(inputFiles) {
  if (!Array.isArray(inputFiles) || inputFiles.length === 0) {
    throw new AppError('Select at least one file to submit', 400);
  }
  if (inputFiles.length > MAX_FILE_COUNT) {
    throw new AppError(`A submission can contain up to ${MAX_FILE_COUNT} files`, 400);
  }

  let totalSize = 0;
  const files = inputFiles.map((inputFile) => {
    if (!inputFile || typeof inputFile.contentBase64 !== 'string' || !BASE64_PATTERN.test(inputFile.contentBase64)) {
      throw new AppError('One of the submitted files is invalid', 400);
    }

    const content = Buffer.from(inputFile.contentBase64, 'base64');
    if (content.length > MAX_FILE_SIZE) {
      throw new AppError('Each submitted file must be 5 MB or smaller', 413);
    }
    if (typeof inputFile.size === 'number' && inputFile.size !== content.length) {
      throw new AppError('A submitted file did not upload completely', 400);
    }
    totalSize += content.length;
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new AppError('The total size of a submission must be 8 MB or smaller', 413);
    }

    const relativePath = String(inputFile.relativePath || inputFile.name || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const name = String(inputFile.name || relativePath.split('/').pop() || '').replace(/\\/g, '/').split('/').pop().trim();
    if (!name || name.length > 300 || relativePath.length > 1000 || relativePath.includes('\0') || relativePath.split('/').includes('..')) {
      throw new AppError('A submitted file has an invalid name or folder path', 400);
    }

    return {
      name,
      relativePath,
      mimeType: String(inputFile.mimeType || 'application/octet-stream').slice(0, 150),
      size: content.length,
      content,
    };
  });

  return files;
}

function canAccessSubmissions(task, userId, userRole) {
  return userRole === 'admin'
    || (task.assignees || []).some((assignee) => String(assignee._id || assignee) === String(userId));
}

async function getSubmissionForApi(query) {
  return TaskSubmission.findOne(query)
    .select('-files.content')
    .populate('submittedBy', 'name email avatar')
    .populate('reviewedBy', 'name email avatar');
}

export const taskSubmissionService = {
  async list(taskId, tenantId, userId, userRole) {
    const task = await taskService.getById(taskId, tenantId, userId, userRole);
    if (!canAccessSubmissions(task, userId, userRole)) {
      throw new AppError('Only task assignees and workspace admins can view submissions', 403);
    }

    return TaskSubmission.find({ taskId, tenantId })
      .select('-files.content')
      .populate('submittedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  },

  async create(taskId, tenantId, userId, userRole, { files: inputFiles, note = '' }) {
    const task = await taskService.getById(taskId, tenantId, userId, userRole);
    const isAssigned = (task.assignees || [])
      .some((assignee) => String(assignee._id || assignee) === String(userId));
    if (!isAssigned) throw new AppError('Only a task assignee can submit work', 403);

    if (String(note).length > 2000) throw new AppError('Submission notes must be 2,000 characters or fewer', 400);

    const existingPending = await TaskSubmission.exists({ taskId, tenantId, status: 'submitted' });
    if (existingPending) throw new AppError('This task already has work waiting for admin review', 409);

    const files = decodeSubmittedFiles(inputFiles);
    let submission;
    try {
      submission = await TaskSubmission.create({
        tenantId,
        projectId: task.projectId?._id || task.projectId,
        taskId,
        submittedBy: userId,
        note: String(note).trim(),
        files,
      });
    } catch (error) {
      if (error.code === 11000) throw new AppError('This task already has work waiting for admin review', 409);
      throw error;
    }

    await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { $set: { status: 'review', completedAt: null, pendingSubmissionCount: 1 }, $inc: { submissionCount: 1 } }
    );
    await projectService.updateProgress(task.projectId?._id || task.projectId, tenantId);

    return getSubmissionForApi({ _id: submission._id, tenantId });
  },

  async getFile(submissionId, fileId, tenantId, userId, userRole) {
    const submission = await TaskSubmission.findOne({ _id: submissionId, tenantId })
      .populate('taskId', 'assignees projectId tenantId');
    if (!submission) throw new AppError('Submission not found', 404);

    const task = await taskService.getById(submission.taskId._id, tenantId, userId, userRole);
    if (!canAccessSubmissions(task, userId, userRole)) {
      throw new AppError('Only task assignees and workspace admins can download submitted files', 403);
    }

    const file = submission.files.id(fileId);
    if (!file) throw new AppError('Submitted file not found', 404);
    return file;
  },

  async review(submissionId, tenantId, userId, userRole, decision, reviewComment = '') {
    if (userRole !== 'admin') throw new AppError('Only a workspace admin can review submitted work', 403);
    if (!['approve', 'request_changes'].includes(decision)) throw new AppError('Choose approve or request changes', 400);
    if (decision === 'request_changes' && !String(reviewComment).trim()) {
      throw new AppError('Add a comment explaining the requested changes', 400);
    }
    if (String(reviewComment).length > 2000) throw new AppError('Review comments must be 2,000 characters or fewer', 400);

    const existing = await TaskSubmission.findOne({ _id: submissionId, tenantId }).select('taskId submittedBy');
    if (!existing) throw new AppError('Submission not found', 404);
    if (String(existing.submittedBy) === String(userId)) {
      throw new AppError('You cannot review your own submission', 403);
    }
    await taskService.getById(existing.taskId, tenantId, userId, userRole);

    const submission = await TaskSubmission.findOneAndUpdate(
      { _id: submissionId, tenantId, status: 'submitted' },
      {
        $set: {
          status: decision === 'approve' ? 'approved' : 'changes_requested',
          reviewedBy: userId,
          reviewComment: String(reviewComment).trim(),
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!submission) throw new AppError('This submission has already been reviewed', 409);

    const pendingCount = await TaskSubmission.countDocuments({
      taskId: submission.taskId,
      tenantId,
      status: 'submitted',
    });
    const nextTaskStatus = pendingCount > 0
      ? 'review'
      : decision === 'approve' ? 'done' : 'in-progress';

    await Task.findOneAndUpdate(
      { _id: submission.taskId, tenantId },
      {
        $set: {
          pendingSubmissionCount: pendingCount,
          status: nextTaskStatus,
          completedAt: nextTaskStatus === 'done' ? new Date() : null,
        },
      }
    );
    await projectService.updateProgress(submission.projectId, tenantId);

    return getSubmissionForApi({ _id: submission._id, tenantId });
  },
};
