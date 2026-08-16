import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Membership from '../models/Membership.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export const authService = {
  generateAccessToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expire });
  },

  generateRefreshToken(userId) {
    return jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpire });
  },

  generateInviteToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  async register({ name, email, password, tenantName }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({ name, email, password });
    const slug = tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const tenant = await Tenant.create({
      name: tenantName,
      slug: `${slug}-${Date.now().toString(36)}`,
      owner: user._id,
    });

    await Membership.create({
      userId: user._id,
      tenantId: tenant._id,
      role: 'admin',
      inviteStatus: 'accepted',
    });

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, tenant, accessToken, refreshToken };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const memberships = await Membership.find({ userId: user._id, inviteStatus: 'accepted' }).populate('tenantId');

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, memberships, accessToken, refreshToken };
  },

  async refreshToken(token) {
    if (!token) throw new AppError('Refresh token required', 400);

    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = this.generateAccessToken(user._id);
    const newRefreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  },

  async inviteUser({ email, tenantId, role, invitedBy }) {
    let user = await User.findOne({ email });
    const inviteToken = this.generateInviteToken();

    if (!user) {
      user = await User.create({
        name: email.split('@')[0],
        email,
        password: crypto.randomBytes(16).toString('hex'),
      });
    }

    const existing = await Membership.findOne({ userId: user._id, tenantId });
    if (existing) {
      throw new AppError('User is already a member of this tenant', 400);
    }

    await Membership.create({
      userId: user._id,
      tenantId,
      role: role || 'member',
      inviteToken,
      inviteStatus: 'pending',
      invitedBy,
    });

    return { inviteToken, userId: user._id };
  },

  async acceptInvite(token) {
    const membership = await Membership.findOne({ inviteToken: token, inviteStatus: 'pending' });
    if (!membership) {
      throw new AppError('Invalid or expired invite', 400);
    }

    membership.inviteStatus = 'accepted';
    membership.inviteToken = null;
    membership.joinedAt = new Date();
    await membership.save();

    await Tenant.findByIdAndUpdate(membership.tenantId, { $inc: { memberCount: 1 } });

    return membership;
  },

  async getInviteDetails(token) {
    const membership = await Membership.findOne({ inviteToken: token, inviteStatus: 'pending' })
      .populate('tenantId', 'name')
      .populate('invitedBy', 'name');
      
    if (!membership) {
      throw new AppError('Invalid or expired invite', 400);
    }

    return {
      tenantName: membership.tenantId?.name || 'Unknown Team',
      invitedBy: membership.invitedBy?.name || 'A team member',
      role: membership.role
    };
  },
};
