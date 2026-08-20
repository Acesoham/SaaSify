import { authService } from '../services/auth.service.js';
import { googleService } from '../services/google.service.js';
import config from '../config/env.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { user, tenant, accessToken, refreshToken } = await authService.register(req.validatedBody);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: { user, tenant, accessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { user, memberships, accessToken, refreshToken } = await authService.login(req.validatedBody);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user,
          tenants: memberships.map((m) => ({
            tenant: m.tenantId,
            role: m.role,
          })),
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      const { accessToken, refreshToken } = await authService.refreshToken(token);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  },

  async invite(req, res, next) {
    try {
      const { inviteToken } = await authService.inviteUser({
        email: req.validatedBody.email,
        tenantId: req.tenantId,
        role: req.validatedBody.role,
        invitedBy: req.userId,
      });

      res.json({
        success: true,
        data: {
          inviteToken,
          inviteLink: `${process.env.CLIENT_URL}/invite/${inviteToken}`,
        },
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async acceptInvite(req, res, next) {
    try {
      const membership = await authService.acceptInvite(req.params.token);
      res.json({ success: true, data: membership, message: 'Invite accepted' });
    } catch (error) {
      next(error);
    }
  },

  async getInviteDetails(req, res, next) {
    try {
      const details = await authService.getInviteDetails(req.params.token);
      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      res.json({ success: true, data: { user: req.user } });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  },

  getGoogleAuthUrl(req, res) {
    const url = googleService.getAuthUrl();
    res.json({ success: true, data: { url } });
  },

  async handleGoogleCallback(req, res) {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.redirect(`${config.clientUrl}/login?error=google_oauth_denied`);
      }

      if (!code) {
        return res.redirect(`${config.clientUrl}/login?error=invalid_callback`);
      }

      // Exchange code for access token
      const accessToken = await googleService.exchangeCodeForToken(code);

      // Fetch user profile from Google
      const profile = await googleService.getGoogleUser(accessToken);

      // Login or register user
      const result = await authService.googleLogin(profile);

      // Redirect to frontend with tokens in URL
      res.redirect(`${config.clientUrl}/oauth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    } catch (err) {
      console.error('[Google OAuth] Callback error:', err);
      res.redirect(`${config.clientUrl}/login?error=google_oauth_failed`);
    }
  },
};
