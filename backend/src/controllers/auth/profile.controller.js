import User from '../../models/User.model.js';
import Post from '../../models/Post.model.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);
  res.status(200).json({ success: true, user });
};

/**
 * PUT /api/auth/settings
 */
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

/**
 * PATCH /api/auth/profile
 * Update current user's profile information (name and avatar).
 */
export const updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  if (name) user.name = name.trim();
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user
  });
};

/**
 * PATCH /api/auth/profile/password
 * Directly update user password after validating current password.
 */
export const updatePasswordDirect = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  if (!user.passwordHash) {
    throw new AppError('Accounts registered via social login do not have passwords.', 400);
  }

  // 1. Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  // 2. Prevent setting same password as before
  const isSame = await user.comparePassword(newPassword);
  if (isSame) {
    throw new AppError('New password cannot be the same as your old password.', 400);
  }

  // Hash and save new password
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.'
  });
};
