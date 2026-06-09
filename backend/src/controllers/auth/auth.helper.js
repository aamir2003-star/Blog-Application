import { signAccessToken, signRefreshToken, refreshCookieOptions } from '../../utils/jwt.utils.js';

/**
 * Issues access and refresh tokens, sets the HTTP-only refresh cookie, and sends the JSON response.
 */
export const issueTokensAndRespond = (res, user, statusCode = 200) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toJSON(),
  });
};
