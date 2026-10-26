import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Membership from '../models/Membership.js';
import ActivityLog from '../models/ActivityLog.js';
import { getAccessibleProjectIds } from './project.service.js';

export const analyticsService = {
  async getDashboardStats(tenantId, userId, userRole) {
    const projectIds = await getAccessibleProjectIds(tenantId, userId, userRole);
    const taskScope = { tenantId, ...(projectIds ? { projectId: { $in: projectIds } } : {}) };
    const projectScope = { tenantId, ...(projectIds ? { _id: { $in: projectIds } } : {}) };
    const [totalTasks, inProgress, completed, urgent, totalProjects, totalMembers] = await Promise.all([
      Task.countDocuments(taskScope),
      Task.countDocuments({ ...taskScope, status: 'in-progress' }),
      Task.countDocuments({ ...taskScope, status: 'done' }),
      Task.countDocuments({ ...taskScope, priority: 'urgent' }),
      Project.countDocuments(projectScope),
      Membership.countDocuments({ tenantId, inviteStatus: 'accepted' }),
    ]);

    // Task completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completionTrend = await Task.aggregate([
      {
        $match: {
          ...taskScope,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Team productivity
    const teamProductivity = await Task.aggregate([
      {
        $match: { ...taskScope, status: 'done' },
      },
      { $unwind: '$assignees' },
      {
        $group: {
          _id: '$assignees',
          completedTasks: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          completedTasks: 1,
        },
      },
      { $sort: { completedTasks: -1 } },
      { $limit: 10 },
    ]);

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      { $match: taskScope },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    return {
      stats: { totalTasks, inProgress, completed, urgent, totalProjects, totalMembers },
      completionTrend,
      teamProductivity,
      priorityDistribution,
    };
  },

  async getProductivityMetrics(tenantId, userId, userRole) {
    const projectIds = await getAccessibleProjectIds(tenantId, userId, userRole);
    const taskScope = { tenantId, ...(projectIds ? { projectId: { $in: projectIds } } : {}) };
    const projectScope = { tenantId, ...(projectIds ? { _id: { $in: projectIds } } : {}) };
    const totalTasks = await Task.countDocuments(taskScope);
    const completedTasks = await Task.countDocuments({ ...taskScope, status: 'done' });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Average task completion time
    const completedWithTime = await Task.find({
      ...taskScope,
      status: 'done',
      completedAt: { $exists: true },
    }).select('createdAt completedAt');

    let avgCompletionTime = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, task) => {
        return sum + (task.completedAt - task.createdAt);
      }, 0);
      avgCompletionTime = Math.round(totalTime / completedWithTime.length / (1000 * 60 * 60 * 24) * 10) / 10;
    }

    // Active projects
    const activeProjects = await Project.countDocuments({ ...projectScope, status: 'active' });

    // Team velocity (tasks completed this week)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const velocity = await Task.countDocuments({
      ...taskScope,
      status: 'done',
      completedAt: { $gte: weekAgo },
    });

    return {
      completionRate,
      avgCompletionTime,
      activeProjects,
      velocity,
    };
  },

  async getRecentActivity(tenantId, limit = 20, userId, userRole) {
    const query = { tenantId };
    const projectIds = await getAccessibleProjectIds(tenantId, userId, userRole);
    if (projectIds) {
      const taskIds = await Task.distinct('_id', { tenantId, projectId: { $in: projectIds } });
      query.$or = [
        { entityType: 'project', entityId: { $in: projectIds } },
        { entityType: 'task', entityId: { $in: taskIds } },
        { entityType: 'comment', 'metadata.taskId': { $in: taskIds } },
      ];
    }
    return ActivityLog.find(query)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
  },
};
