import User from '../../models/User.model.js';
import {
  verifyRefreshToken,
  clearCookieOptions,
} from '../../utils/jwt.utils.js';
import { AppError } from '../../middleware/error.middleware.js';
import { issueTokensAndRespond } from './auth.helper.js';

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.passwordHash) {
    throw new AppError(
      'This account uses social login. Please sign in with Google or GitHub.',
      401
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  issueTokensAndRespond(res, user);
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError('No refresh token found. Please log in again.', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    res.clearCookie('refreshToken', clearCookieOptions);
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    res.clearCookie('refreshToken', clearCookieOptions);
    throw new AppError('User no longer exists.', 401);
  }

  issueTokensAndRespond(res, user);
};

/**
 * POST /api/auth/logout
 */
export const logout = (_req, res) => {
  res.clearCookie('refreshToken', clearCookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
