import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import {
  initRegister,
  verifyOtpAndRegister,
  resendOtp,
  login,
  refresh,
  logout,
  getMe,
  updateSettings,
  googleCallback,
  githubCallback,
  googleOneTap,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  initRegisterSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validators.js';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/** Strict limiter for credential-based auth endpoints. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

/** OTP verification — tighter limit to prevent brute force. */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP attempts. Please wait before trying again.' },
});

/** Token refresh — softer limit (called automatically by clients). */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts. Please log in again.' },
});

// ─── Registration (2-step OTP flow) ──────────────────────────────────────────

/**
 * POST /api/auth/register/init
 * Step 1: Validate name/email/password → send OTP email.
 */
router.post(
  '/register/init',
  authLimiter,
  validate(initRegisterSchema),
  initRegister
);

/**
 * POST /api/auth/register/verify
 * Step 2: Verify OTP → create account → issue tokens.
 */
router.post(
  '/register/verify',
  otpLimiter,
  validate(verifyOtpSchema),
  verifyOtpAndRegister
);

/**
 * POST /api/auth/register/resend
 * Re-send OTP (throttled to 60s between requests).
 */
router.post(
  '/register/resend',
  authLimiter,
  validate(resendOtpSchema),
  resendOtp
);

// ─── Login / Session Management ───────────────────────────────────────────────

/** POST /api/auth/login */
router.post('/login', authLimiter, validate(loginSchema), login);

/** POST /api/auth/forgot-password */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

/** POST /api/auth/reset-password */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

/** POST /api/auth/refresh */
router.post('/refresh', refreshLimiter, refresh);

/** POST /api/auth/logout */
router.post('/logout', logout);

/** GET /api/auth/me */
router.get('/me', verifyToken, getMe);

/** PATCH /api/auth/settings */
router.patch('/settings', verifyToken, updateSettings);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  googleCallback
);

/**
 * POST /api/auth/google/one-tap
 * Verifies a Google Identity Services credential token server-side
 * and returns our own JWT tokens. Used by the One Tap popup.
 */
router.post('/google/one-tap', authLimiter, googleOneTap);

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=github_auth_failed`,
  }),
  githubCallback
);

export default router;
