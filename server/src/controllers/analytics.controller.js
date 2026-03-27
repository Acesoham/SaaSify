import { analyticsService } from '../services/analytics.service.js';

export const analyticsController = {
  async getDashboard(req, res, next) {
    try {
      const data = await analyticsService.getDashboardStats(req.tenantId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getProductivity(req, res, next) {
    try {
      const data = await analyticsService.getProductivityMetrics(req.tenantId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getActivity(req, res, next) {
    try {
      const data = await analyticsService.getRecentActivity(req.tenantId, Number(req.query.limit) || 20);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
