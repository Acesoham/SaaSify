import Tenant from '../models/Tenant.js';
import Membership from '../models/Membership.js';

export const tenantController = {
  async getMyTenants(req, res, next) {
    try {
      const memberships = await Membership.find({ userId: req.userId, inviteStatus: 'accepted' })
        .populate('tenantId');
      const tenants = memberships.map((m) => ({ tenant: m.tenantId, role: m.role }));
      res.json({ success: true, data: tenants });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const tenant = await Tenant.findOne({ _id: req.tenantId });
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      res.json({ success: true, data: tenant });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const tenant = await Tenant.findByIdAndUpdate(req.tenantId, { $set: req.body }, { new: true });
      res.json({ success: true, data: tenant });
    } catch (error) {
      next(error);
    }
  },

  async getMembers(req, res, next) {
    try {
      const members = await Membership.find({ tenantId: req.tenantId, inviteStatus: 'accepted' })
        .populate('userId', 'name email avatar');
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      await Membership.findOneAndDelete({ userId: req.params.userId, tenantId: req.tenantId });
      await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { memberCount: -1 } });
      res.json({ success: true, message: 'Member removed' });
    } catch (error) {
      next(error);
    }
  },

  async updateMemberRole(req, res, next) {
    try {
      const membership = await Membership.findOneAndUpdate(
        { userId: req.params.userId, tenantId: req.tenantId },
        { role: req.body.role },
        { new: true }
      ).populate('userId', 'name email avatar');
      res.json({ success: true, data: membership });
    } catch (error) {
      next(error);
    }
  },
};
