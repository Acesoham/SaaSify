import Project from '../models/Project.js';
import Task from '../models/Task.js';
import TaskSubmission from '../models/TaskSubmission.js';
import App from '../models/App.js';
import Membership from '../models/Membership.js';
import { AppError } from '../middleware/errorHandler.js';

export function projectAccessQuery(tenantId, userId, userRole) {
  if (userRole === 'admin') return { tenantId };
  return { tenantId, $or: [{ members: userId }, { owner: userId }] };
}

async function projectReadAccessQuery(tenantId, userId, userRole) {
  const query = projectAccessQuery(tenantId, userId, userRole);
  if (userRole !== 'admin') {
    const assignedProjectIds = await Task.distinct('projectId', { tenantId, assignees: userId });
    query.$or.push({ _id: { $in: assignedProjectIds } });
  }
  return query;
}

export async function getAccessibleProjectIds(tenantId, userId, userRole) {
  if (userRole === 'admin') return Project.find({ tenantId }).distinct('_id');

  const assignedProjectIds = await Task.distinct('projectId', { tenantId, assignees: userId });
  return Project.find({
    tenantId,
    $or: [
      { members: userId },
      { owner: userId },
      { _id: { $in: assignedProjectIds } },
    ],
  }).distinct('_id');
}

export const projectService = {
  async getAll(tenantId, { page = 1, limit = 20, status }, userId, userRole) {
    const query = await projectReadAccessQuery(tenantId, userId, userRole);
    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('appId', 'name repoFullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Project.countDocuments(query);

    return { projects, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  },

  async getById(projectId, tenantId, userId, userRole, { requireMembership = false } = {}) {
    const accessQuery = requireMembership
      ? projectAccessQuery(tenantId, userId, userRole)
      : await projectReadAccessQuery(tenantId, userId, userRole);
    const project = await Project.findOne({ _id: projectId, ...accessQuery })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('appId', 'name repoFullName');

    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async create(data, tenantId, userId) {
    const memberIds = [...new Set([String(userId), ...(data.members || []).map(String)])];
    const acceptedMemberCount = await Membership.countDocuments({
      userId: { $in: memberIds },
      tenantId,
      inviteStatus: 'accepted',
    });
    if (acceptedMemberCount !== memberIds.length) {
      throw new AppError('Project members must be accepted members of this workspace', 400);
    }

    if (data.appId) {
      const app = await App.findOne({ _id: data.appId, tenantId, status: { $ne: 'deleted' } });
      if (!app) throw new AppError('Repository app not found in this workspace', 400);
    }

    const project = await Project.create({
      ...data,
      tenantId,
      owner: userId,
      members: memberIds,
    });

    await project.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members', select: 'name email avatar' },
      { path: 'appId', select: 'name repoFullName' },
    ]);
    return project;
  },

  async update(projectId, data, tenantId, userId, userRole) {
    if (Object.prototype.hasOwnProperty.call(data, 'appId') && data.appId) {
      const app = await App.findOne({ _id: data.appId, tenantId, status: { $ne: 'deleted' } });
      if (!app) throw new AppError('Repository app not found in this workspace', 400);
    }

    const project = await Project.findOneAndUpdate(
      { _id: projectId, ...projectAccessQuery(tenantId, userId, userRole) },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('appId', 'name repoFullName');

    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async remove(projectId, tenantId) {
    const project = await Project.findOneAndDelete({ _id: projectId, tenantId });
    if (!project) throw new AppError('Project not found', 404);
    await Task.deleteMany({ projectId, tenantId });
    await TaskSubmission.deleteMany({ projectId, tenantId });
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
