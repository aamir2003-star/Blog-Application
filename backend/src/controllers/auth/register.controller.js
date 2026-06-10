import User from '../../models/User.model.js';
import OTPRecord from '../../models/OTP.model.js';
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  sendOTPEmail,
} from '../../utils/otp.utils.js';
import { AppError } from '../../middleware/error.middleware.js';
import { issueTokensAndRespond } from './auth.helper.js';

/**
 * POST /api/auth/register/init
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
      `Failed to send verification code: ${err.message}. Please check your backend SMTP credentials.`,
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

/**
 * POST /api/auth/register/verify
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

  // Check if OTP has expired
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

/**
 * POST /api/auth/register/resend
 */
export const resendOtp = async (req, res) => {
  const { email } = req.body;
  const RESEND_THROTTLE_SECONDS = 60;

  const record = await OTPRecord.findOne({ email });

  if (!record) {
    throw new AppError(
      'No pending verification found. Please start the registration process again.',
      404
    );
  }

  // Throttle check
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
      `Failed to send verification code: ${err.message}. Please check your backend SMTP credentials.`,
      500
    );
  }

  res.status(200).json({
    success: true,
    message: 'A new verification code has been sent to your email.',
  });
};
