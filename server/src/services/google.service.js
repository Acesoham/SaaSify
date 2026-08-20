import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export const googleService = {
  /**
   * Build the Google OAuth authorization URL.
   */
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Exchange the authorization code for an access token via Google API.
   */
  async exchangeCodeForToken(code) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        code,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AppError(`Google OAuth error: ${data.error_description || data.error}`, 400);
    }

    return data.access_token;
  },

  /**
   * Fetch authenticated user's Google profile using the access token.
   */
  async getGoogleUser(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AppError(`Google API error: ${data.error.message}`, 400);
    }

    return data;
  },
};
