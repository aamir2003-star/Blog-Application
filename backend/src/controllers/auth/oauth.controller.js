import { OAuth2Client } from 'google-auth-library';
import User from '../../models/User.model.js';
import { signAccessToken, signRefreshToken, refreshCookieOptions } from '../../utils/jwt.utils.js';
import { AppError } from '../../middleware/error.middleware.js';
import { issueTokensAndRespond } from './auth.helper.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * GET /api/auth/google/callback
 */
export const googleCallback = (req, res) => {
  const user = req.user;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.redirect(
    `${process.env.CLIENT_URL}/auth/oauth-callback?token=${accessToken}&provider=google`
  );
};

/**
 * GET /api/auth/github/callback
 */
export const githubCallback = (req, res) => {
  const user = req.user;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.redirect(
    `${process.env.CLIENT_URL}/auth/oauth-callback?token=${accessToken}&provider=github`
  );
};

/**
 * POST /api/auth/google/one-tap
 */
export const googleOneTap = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new AppError('Google credential token is required.', 400);
  }

  // Verify the ID token with Google
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid or expired Google token. Please try again.', 401);
  }

  if (!payload) {
    throw new AppError('Could not extract user info from Google token.', 401);
  }

  const {
    sub: googleId,   // Unique Google user ID
    email,
    name,
    picture: avatar,
    email_verified,
  } = payload;

  // Reject unverified Google emails (rare but possible)
  if (!email_verified) {
    throw new AppError('Your Google email address is not verified.', 403);
  }

  // 1. Find by Google ID (returning One Tap user)
  let user = await User.findOne({ googleId });

  if (!user && email) {
    // 2. Try email-based account linking
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    }
  }

  if (!user) {
    // 3. Brand-new user via One Tap
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      avatar: avatar || null,
      passwordHash: null,
    });
  }

  issueTokensAndRespond(res, user);
};
