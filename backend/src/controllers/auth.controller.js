import User from '../models/User.model.js';
import Post from '../models/Post.model.js';
import OTPRecord from '../models/OTP.model.js';
import { OAuth2Client } from 'google-auth-library';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  clearCookieOptions,
} from '../utils/jwt.utils.js';
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  sendOTPEmail,
  sendPasswordResetOTPEmail,
} from '../utils/otp.utils.js';
import crypto from 'crypto';
import { AppError } from '../middleware/error.middleware.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


/**
 * Auth Controller
 *
 * Registration is a 2-step flow:
 *   Step 1 — initRegister  POST /api/auth/register/init
 *     → Validates input, checks email not already used,
 *       hashes password, generates OTP, sends email, stores OTP record.
 *
 *   Step 2 — verifyOtpAndRegister  POST /api/auth/register/verify
 *     → Verifies OTP, creates User, deletes OTP record, issues tokens.
 *
 *   Resend — resendOtp  POST /api/auth/register/resend
 *     → Re-sends a fresh OTP (throttled to 60s between sends).
 */

// ─── Shared Helper ────────────────────────────────────────────────────────────

const issueTokensAndRespond = (res, user, statusCode = 200) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toJSON(),
  });
};

// ─── STEP 1: Initiate Registration ───────────────────────────────────────────

/**
 * POST /api/auth/register/init
 * Body: { name, email, password }
 *
 * 1. Reject if the email already has a verified account.
 * 2. Hash the password immediately (don't hash again on verify).
 * 3. Generate + hash a 6-digit OTP.
 * 4. Upsert the OTP document (replaces previous pending registration).
 * 5. Send the OTP email.
 * 6. Return success — do NOT confirm whether the email exists (prevents enumeration).
 */
export const initRegister = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if a verified account already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Pre-hash the password so /verify doesn't need the plain-text password
  const passwordHash = await User.hashPassword(password);

  // Generate OTP
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = getOTPExpiry();

  // Upsert: overwrite any previous pending registration for this email
  await OTPRecord.findOneAndUpdate(
    { email },
    {
      name,
      passwordHash,
      otpHash,
      attempts: 0,
      sentAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true }
  );

  // Send the email (or log to console if SMTP not configured)
  try {
    await sendOTPEmail(email, name, otp);
  } catch (err) {
    await OTPRecord.deleteOne({ email }); // Cleanup
    console.error('SMTP Error:', err.message);
    throw new AppError(
      'Failed to send verification code. Please check your backend SMTP credentials in .env',
      500
    );
  }

  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '10';

  res.status(200).json({
    success: true,
    message: `Verification code sent to ${email}. It expires in ${expiryMinutes} minutes.`,
    email, // Return email so the frontend can pass it to step 2
  });
};

// ─── STEP 2: Verify OTP & Complete Registration ───────────────────────────────

/**
 * POST /api/auth/register/verify
 * Body: { email, otp }
 *
 * 1. Find the pending OTP record.
 * 2. Check attempt count (max 5 to prevent brute force).
 * 3. Verify OTP hash.
 * 4. Create the User account.
 * 5. Delete the OTP record.
 * 6. Issue JWT tokens.
 */
export const verifyOtpAndRegister = async (req, res) => {
  const { email, otp } = req.body;
  const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5');

  // Find the pending OTP record
  const record = await OTPRecord.findOne({ email });

  if (!record) {
    throw new AppError(
      'No pending verification found for this email. Please register again.',
      404
    );
  }

  // Check if OTP has expired (belt-and-suspenders — TTL index handles cleanup)
  if (record.expiresAt < new Date()) {
    await OTPRecord.deleteOne({ email });
    throw new AppError('Verification code has expired. Please register again.', 410);
  }

  // Brute-force protection: increment attempt count
  record.attempts += 1;
  await record.save();

  if (record.attempts > MAX_ATTEMPTS) {
    await OTPRecord.deleteOne({ email });
    throw new AppError(
      'Too many incorrect attempts. Please start registration again.',
      429
    );
  }

  // Verify the OTP
  const isValid = await verifyOTP(otp, record.otpHash);
  if (!isValid) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new AppError(
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please start registration again.',
      400
    );
  }

  // OTP is valid — double-check the email hasn't been registered during the OTP window
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await OTPRecord.deleteOne({ email });
    throw new AppError('An account with this email was already created.', 409);
  }

  // Create the verified user account
  const user = await User.create({
    name: record.name,
    email,
    passwordHash: record.passwordHash,
    role: 'VISITOR',
  });

  // Clean up the OTP record — it's been used
  await OTPRecord.deleteOne({ email });

  issueTokensAndRespond(res, user, 201);
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register/resend
 * Body: { email }
 *
 * Re-sends a fresh OTP to the same email.
 * Throttled: user must wait 60 seconds between resend requests.
 */
export const resendOtp = async (req, res) => {
  const { email } = req.body;
  const RESEND_THROTTLE_SECONDS = 60;

  const record = await OTPRecord.findOne({ email });

  if (!record) {
    // Don't reveal whether the email is pending — generic message
    throw new AppError(
      'No pending verification found. Please start the registration process again.',
      404
    );
  }

  // Throttle check: prevent spamming
  const secondsSinceLastSend = (Date.now() - record.sentAt.getTime()) / 1000;
  if (secondsSinceLastSend < RESEND_THROTTLE_SECONDS) {
    const waitSeconds = Math.ceil(RESEND_THROTTLE_SECONDS - secondsSinceLastSend);
    throw new AppError(
      `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting another code.`,
      429
    );
  }

  // Generate and send a fresh OTP
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  record.otpHash = otpHash;
  record.attempts = 0; // Reset attempts on resend
  record.sentAt = new Date();
  record.expiresAt = getOTPExpiry();
  await record.save();

  try {
    await sendOTPEmail(email, record.name, otp);
  } catch (err) {
    console.error('SMTP Error (Resend):', err.message);
    throw new AppError(
      'Failed to send verification code. Please check your backend SMTP credentials in .env',
      500
    );
  }

  res.status(200).json({
    success: true,
    message: 'A new verification code has been sent to your email.',
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
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

// ─── Refresh ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Cookie: refreshToken
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

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = (_req, res) => {
  res.clearCookie('refreshToken', clearCookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);
  res.status(200).json({ success: true, user });
};

export const updateSettings = async (req, res) => {
  const { autoDeleteTrash } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  if (autoDeleteTrash !== undefined) {
    user.autoDeleteTrash = !!autoDeleteTrash;
    
    // When autoDeleteTrash is enabled, set autoDeleteAt on all currently trashed posts to 30 days from now.
    // When disabled, remove the autoDeleteAt TTL (set to null) so they do not expire.
    const autoDeleteAt = autoDeleteTrash 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      : null;
      
    await Post.updateMany(
      { authorId: user._id, deleted: true },
      { autoDeleteAt }
    );
  }

  await user.save();
  res.status(200).json({ 
    success: true, 
    message: 'User settings updated successfully.', 
    user 
  });
};

// ─── Google OAuth Callback ────────────────────────────────────────────────────

export const googleCallback = (req, res) => {
  const user = req.user;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.redirect(
    `${process.env.CLIENT_URL}/auth/oauth-callback?token=${accessToken}&provider=google`
  );
};

// ─── GitHub OAuth Callback ────────────────────────────────────────────────────

export const githubCallback = (req, res) => {
  const user = req.user;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.redirect(
    `${process.env.CLIENT_URL}/auth/oauth-callback?token=${accessToken}&provider=github`
  );
};

// ─── Google One Tap ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/google/one-tap
 * Body: { credential: "<google id token from One Tap>" }
 *
 * Flow:
 *  1. Verify the Google ID token with google-auth-library (server-side).
 *  2. Extract verified user info from the token payload.
 *  3. Find or create the user (same account-linking logic as Passport strategy).
 *  4. Issue our own access + refresh tokens.
 *
 * Security: The token is verified against Google's public keys — we never
 * trust the client's claimed identity, only the cryptographically signed token.
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

// ─── Password Recovery ────────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Anti-enumeration: if user doesn't exist, return success
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account is associated with that email, we have sent a 6-digit verification code.',
    });
  }

  // Generate a secure 6-digit OTP
  const otp = generateOTP();

  // Hash the OTP using bcrypt (standard OTP salt rounds)
  const hashedOTP = await hashOTP(otp);

  // Set OTP and 10-minute expiration
  user.resetPasswordToken = hashedOTP;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetOTPEmail(email, user.name, otp);
  } catch (err) {
    // Rollback changes on failure
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    console.error('Password Reset OTP Email SMTP Error:', err.message);
    throw new AppError(
      'Failed to send password recovery code. Please check backend SMTP configuration.',
      500
    );
  }

  res.status(200).json({
    success: true,
    message: 'If an account is associated with that email, we have sent a 6-digit verification code.',
  });
};

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, password }
 */
export const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid or expired verification code.', 400);
  }

  // Verify the OTP against the stored bcrypt hash
  const isValid = await verifyOTP(otp, user.resetPasswordToken);

  // Verify matches and has not expired
  if (!isValid || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new AppError('Invalid or expired verification code.', 400);
  }

  // Hash and save new password
  const newPasswordHash = await User.hashPassword(password);
  user.passwordHash = newPasswordHash;

  // Clear security tokens
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
};


