import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { AppError } from '../middleware/errorHandler.js';

export const projectService = {
  async getAll(tenantId, { page = 1, limit = 20, status }) {
    const query = { tenantId };
    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Project.countDocuments(query);

    return { projects, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  },

  async getById(projectId, tenantId) {
    const project = await Project.findOne({ _id: projectId, tenantId })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async create(data, tenantId, userId) {
    const project = await Project.create({
      ...data,
      tenantId,
      owner: userId,
      members: [userId, ...(data.members || [])],
    });

    return project.populate('owner', 'name email avatar');
  },

  async update(projectId, data, tenantId) {
    const project = await Project.findOneAndUpdate(
      { _id: projectId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar').populate('members', 'name email avatar');

    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async remove(projectId, tenantId) {
    const project = await Project.findOneAndDelete({ _id: projectId, tenantId });
    if (!project) throw new AppError('Project not found', 404);
    await Task.deleteMany({ projectId, tenantId });
    return project;
  },

  async updateProgress(projectId, tenantId) {
    const tasks = await Task.find({ projectId, tenantId });
    if (tasks.length === 0) return;

    const completed = tasks.filter((t) => t.status === 'done').length;
    const progress = Math.round((completed / tasks.length) * 100);

    await Project.findByIdAndUpdate(projectId, { progress, taskCount: tasks.length });
  },
};
