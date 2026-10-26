import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import Project from '../models/Project.js';
import Membership from '../models/Membership.js';
import TaskSubmission from '../models/TaskSubmission.js';
import { AppError } from '../middleware/errorHandler.js';
import { projectService, getAccessibleProjectIds } from './project.service.js';

async function grantProjectAccessToAssignees(project, assignees = [], tenantId) {
  const assigneeIds = [...new Set(assignees.map(String))];
  if (assigneeIds.length === 0) return;

  const memberships = await Membership.find({
    userId: { $in: assigneeIds },
    tenantId,
    inviteStatus: 'accepted',
  }).select('userId');
  if (memberships.length !== assigneeIds.length) {
    throw new AppError('Task assignees must be accepted members of this workspace', 400);
  }

  const projectMemberIds = new Set([
    String(project.owner),
    ...(project.members || []).map(String),
  ]);
  const newProjectMemberIds = assigneeIds.filter((assigneeId) => !projectMemberIds.has(assigneeId));
  if (newProjectMemberIds.length === 0) return;

  await Project.updateOne(
    { _id: project._id, tenantId },
    { $addToSet: { members: { $each: newProjectMemberIds } } }
  );
}

async function canManageProjectTasks(projectId, tenantId, userId, userRole) {
  if (userRole === 'admin') return true;
  const project = await Project.findOne({ _id: projectId, tenantId }).select('owner members');
  return Boolean(project && (
    String(project.owner) === String(userId)
    || (project.members || []).some((memberId) => String(memberId) === String(userId))
  ));
}

export const taskService = {
  async getAll(tenantId, { page = 1, limit = 50, status, priority, projectId, assignee }, userId, userRole) {
    const accessibleProjectIds = await getAccessibleProjectIds(tenantId, userId, userRole);
    const query = { tenantId, projectId: { $in: accessibleProjectIds } };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId) {
      if (!accessibleProjectIds.some((id) => String(id) === projectId)) {
        throw new AppError('Project not found', 404);
      }
      query.projectId = projectId;
    }
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

  async getById(taskId, tenantId, userId, userRole) {
    const query = {
      _id: taskId,
      tenantId,
      projectId: { $in: await getAccessibleProjectIds(tenantId, userId, userRole) },
    };
    const task = await Task.findOne(query)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name color');

    if (!task) throw new AppError('Task not found', 404);
    return task;
  },

  async create(data, tenantId, userId, userRole) {
    const project = await Project.findOne({ _id: data.projectId, tenantId });
    if (!project) throw new AppError('Project not found', 404);
    if (!(project.members || []).some((memberId) => String(memberId) === String(userId)) && String(project.owner) !== String(userId)) {
      throw new AppError('You do not have access to this project', 404);
    }
    await grantProjectAccessToAssignees(project, data.assignees, tenantId);

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

  async update(taskId, data, tenantId, userId, userRole) {
    const task = await this.getById(taskId, tenantId, userId, userRole);
    const taskProjectId = task.projectId?._id || task.projectId;
    if (!await canManageProjectTasks(taskProjectId, tenantId, userId, userRole)) {
      throw new AppError('Only project members can edit tasks', 403);
    }
    if (data.status === 'done' && userRole !== 'admin') {
      throw new AppError('Only a workspace admin can complete a task after reviewing its submission', 403);
    }
    if (data.assignees) {
      const project = await Project.findOne({ _id: task.projectId?._id || task.projectId, tenantId });
      if (!project) throw new AppError('Project not found', 404);
      await grantProjectAccessToAssignees(project, data.assignees, tenantId);
    }

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

  async remove(taskId, tenantId, userId, userRole) {
    const accessibleTask = await this.getById(taskId, tenantId, userId, userRole);
    const taskProjectId = accessibleTask.projectId?._id || accessibleTask.projectId;
    if (!await canManageProjectTasks(taskProjectId, tenantId, userId, userRole)) {
      throw new AppError('Only project members can delete tasks', 403);
    }
    const task = await Task.findOneAndDelete({ _id: accessibleTask._id, tenantId });
    if (!task) throw new AppError('Task not found', 404);
    await Comment.deleteMany({ taskId, tenantId });
    await TaskSubmission.deleteMany({ taskId, tenantId });
    await projectService.updateProgress(task.projectId, tenantId);
    return task;
  },

  async addComment(taskId, tenantId, userId, content, userRole) {
    await this.getById(taskId, tenantId, userId, userRole);

    const comment = await Comment.create({ taskId, tenantId, userId, content });
    await Task.findByIdAndUpdate(taskId, { $inc: { commentCount: 1 } });

    return comment.populate('userId', 'name email avatar');
  },

  async getComments(taskId, tenantId, userId, userRole) {
    await this.getById(taskId, tenantId, userId, userRole);
    return Comment.find({ taskId, tenantId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });
  },

  async getKanbanBoard(tenantId, projectId, userId, userRole) {
    const accessibleProjectIds = await getAccessibleProjectIds(tenantId, userId, userRole);
    const query = { tenantId };
    if (projectId && !accessibleProjectIds.some((id) => String(id) === projectId)) {
      throw new AppError('Project not found', 404);
    }
    query.projectId = projectId || { $in: accessibleProjectIds };

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name color')
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
