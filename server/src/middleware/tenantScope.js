import Membership from '../models/Membership.js';

export const tenantScope = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required in x-tenant-id header.' });
    }

    // Verify user belongs to this tenant
    const membership = await Membership.findOne({
      userId: req.userId,
      tenantId,
      inviteStatus: 'accepted',
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'You do not have access to this tenant.' });
    }

    req.tenantId = tenantId;
    req.membership = membership;
    req.userRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};
