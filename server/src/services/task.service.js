import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import { AppError } from '../middleware/errorHandler.js';
import { projectService } from './project.service.js';

export const taskService = {
  async getAll(tenantId, { page = 1, limit = 50, status, priority, projectId, assignee }) {
    const query = { tenantId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId) query.projectId = projectId;
    if (assignee) query.assignees = assignee;

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name color')
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Task.countDocuments(query);

    return { tasks, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  },

  async getById(taskId, tenantId) {
    const task = await Task.findOne({ _id: taskId, tenantId })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name color');

    if (!task) throw new AppError('Task not found', 404);
    return task;
  },

  async create(data, tenantId, userId) {
    const task = await Task.create({
      ...data,
      tenantId,
      createdBy: userId,
    });

    await projectService.updateProgress(data.projectId, tenantId);

    return task.populate([
      { path: 'assignees', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'projectId', select: 'name color' },
    ]);
  },

  async update(taskId, data, tenantId) {
    const task = await Task.findOne({ _id: taskId, tenantId });
    if (!task) throw new AppError('Task not found', 404);

    if (data.status === 'done' && task.status !== 'done') {
      data.completedAt = new Date();
    }
    if (data.status && data.status !== 'done') {
      data.completedAt = null;
    }

    const updated = await Task.findByIdAndUpdate(taskId, { $set: data }, { new: true, runValidators: true })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name color');

    await projectService.updateProgress(updated.projectId._id || updated.projectId, tenantId);

    return updated;
  },

  async remove(taskId, tenantId) {
    const task = await Task.findOneAndDelete({ _id: taskId, tenantId });
    if (!task) throw new AppError('Task not found', 404);
    await Comment.deleteMany({ taskId, tenantId });
    await projectService.updateProgress(task.projectId, tenantId);
    return task;
  },

  async addComment(taskId, tenantId, userId, content) {
    const task = await Task.findOne({ _id: taskId, tenantId });
    if (!task) throw new AppError('Task not found', 404);

    const comment = await Comment.create({ taskId, tenantId, userId, content });
    await Task.findByIdAndUpdate(taskId, { $inc: { commentCount: 1 } });

    return comment.populate('userId', 'name email avatar');
  },

  async getComments(taskId, tenantId) {
    return Comment.find({ taskId, tenantId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });
  },

  async getKanbanBoard(tenantId, projectId) {
    const query = { tenantId };
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    const columns = {
      backlog: tasks.filter((t) => t.status === 'backlog'),
      todo: tasks.filter((t) => t.status === 'todo'),
      'in-progress': tasks.filter((t) => t.status === 'in-progress'),
      review: tasks.filter((t) => t.status === 'review'),
      done: tasks.filter((t) => t.status === 'done'),
    };

    return columns;
  },
};
