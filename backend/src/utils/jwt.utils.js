import jwt from 'jsonwebtoken';

/**
 * JWT utility functions — sign and verify access + refresh tokens.
 *
 * Dual-token strategy:
 *  - Access token:  short-lived (15m), sent in Authorization header
 *  - Refresh token: long-lived (7d), stored in httpOnly cookie
 *
 * The access token payload embeds the user's id and role
 * so that middleware never needs an extra DB round-trip.
 */

// ─── Token Payloads ───────────────────────────────────────────────────────────

/**
 * Build the minimal JWT payload for a user.
 * Only include what middleware actually needs — keep tokens lean.
 */
const buildPayload = (user) => ({
  sub: user._id.toString(), // 'sub' is the JWT standard claim for subject ID
  role: user.role,
  email: user.email,
});

// ─── Sign ─────────────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token.
 * @param {Object} user - Mongoose user document
 * @returns {string} Signed JWT access token
 */
export const signAccessToken = (user) => {
  return jwt.sign(buildPayload(user), process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    issuer: 'engineering-blog-api',
    audience: 'engineering-blog-client',
  });
};

/**
 * Sign a long-lived refresh token.
 * Contains only the user id (minimal info — just enough to re-issue access tokens).
 * @param {Object} user - Mongoose user document
 * @returns {string} Signed JWT refresh token
 */
export const signRefreshToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString() }, // Minimal payload for refresh token
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      issuer: 'engineering-blog-api',
      audience: 'engineering-blog-client',
    }
  );
};

// ─── Verify ───────────────────────────────────────────────────────────────────

/**
 * Verify an access token.
 * @param {string} token - JWT string from Authorization header
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError} on invalid/expired token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
    issuer: 'engineering-blog-api',
    audience: 'engineering-blog-client',
  });
};

/**
 * Verify a refresh token.
 * @param {string} token - JWT string from httpOnly cookie
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError} on invalid/expired token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
    issuer: 'engineering-blog-api',
    audience: 'engineering-blog-client',
  });
};

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/**
 * Standard options for the refresh token cookie.
 * httpOnly: JS cannot read it (XSS protection)
 * sameSite: CSRF protection
 * secure: HTTPS only in production
 */
export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth', // Cookie only sent to /api/auth/* endpoints
};

/**
 * Clear cookie options — used on logout.
 */
export const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
};
