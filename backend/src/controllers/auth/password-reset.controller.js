import User from '../../models/User.model.js';
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  sendPasswordResetOTPEmail,
} from '../../utils/otp.utils.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * POST /api/auth/forgot-password
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

  // Prevent setting same password as before
  if (user.passwordHash) {
    const isSame = await user.comparePassword(password);
    if (isSame) {
      throw new AppError('New password cannot be the same as your old password.', 400);
    }
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
