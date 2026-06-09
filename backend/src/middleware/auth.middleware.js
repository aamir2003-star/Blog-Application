import { verifyAccessToken } from '../utils/jwt.utils.js';

/**
 * verifyToken — Authentication Middleware
 *
 * Extracts the Bearer JWT from the Authorization header,
 * verifies its signature, and attaches the decoded payload
 * to `req.user` so downstream middleware and controllers
 * can access the authenticated user's id and role without
 * hitting the database.
 *
 * Usage:
 *   router.get('/protected', verifyToken, controller)
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is malformed.',
      });
    }

    // verifyAccessToken throws on invalid/expired token
    const decoded = verifyAccessToken(token);

    // Attach the decoded payload as req.user
    // Shape: { sub: userId, role: 'VISITOR'|'CREATOR', email }
    req.user = {
      _id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * optionalAuth — Soft authentication middleware
 *
 * Tries to verify the token if present, but does NOT reject
 * the request if there is no token or if it is expired.
 * Attaches the user object or sets req.user to null.
 */
export const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = {
        _id: decoded.sub,
        role: decoded.role,
        email: decoded.email,
      };
    } else {
      req.user = null;
    }
  } catch {
    // Silently ignore invalid/expired tokens for optional auth
    req.user = null;
  }
  next();
};
