import Post from '../../models/Post.model.js';
import User from '../../models/User.model.js';
import { generateUniqueSlug } from '../../utils/slug.utils.js';
import { AppError } from '../../middleware/error.middleware.js';
import { generateOTP, hashOTP, verifyOTP, sendPostDeletionOTPEmail } from '../../utils/otp.utils.js';
import { assertOwnership } from './posts.helper.js';

/**
 * POST /api/posts
 * Authorization: Bearer token required (any role can post)
 * Body: { title, htmlContent, category, excerpt, coverImage?, seoKeywords?, status? }
 */
export const createPost = async (req, res) => {
  const { title, htmlContent, category, excerpt, coverImage, seoKeywords, status } =
    req.body;

  // Generate a unique, collision-safe slug from the title
  const slug = await generateUniqueSlug(title);

  // Create the post
  const post = await Post.create({
    title,
    slug,
    htmlContent,
    category,
    excerpt,
    coverImage: coverImage || null,
    seoKeywords: seoKeywords || '',
    status: status || 'DRAFT',
    authorId: req.user._id,
  });

  // ── Role Escalation: VISITOR → CREATOR ────────────────────────────────────
  const user = await User.findById(req.user._id);
  if (user && user.role === 'VISITOR') {
    await user.promoteToCreator();
  }

  res.status(201).json({
    success: true,
    message: 'Post created successfully.',
    data: post,
    ...(user?.role === 'CREATOR' && req.user.role === 'VISITOR'
      ? { roleUpgraded: true, newRole: 'CREATOR' }
      : {}),
  });
};

/**
 * PUT /api/posts/:id
 * Authorization: Bearer token required + must be post owner
 * Body: Partial post fields (all optional)
 */
export const updatePost = async (req, res) => {
  const post = await assertOwnership(req.params.id, req.user._id);

  const { title, htmlContent, category, excerpt, coverImage, seoKeywords, status } =
    req.body;

  // Only regenerate slug if the title actually changed
  if (title && title !== post.title) {
    post.slug = await generateUniqueSlug(title, post._id);
    post.title = title;
  }

  if (htmlContent !== undefined) post.htmlContent = htmlContent;
  if (category !== undefined) post.category = category;
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (coverImage !== undefined) post.coverImage = coverImage || null;
  if (seoKeywords !== undefined) post.seoKeywords = seoKeywords;
  if (status !== undefined) post.status = status;

  await post.save();

  res.status(200).json({
    success: true,
    message: 'Post updated successfully.',
    data: post,
  });
};

/**
 * DELETE /api/posts/:id
 * Authorization: Bearer token required + must be post owner
 */
export const deletePost = async (req, res) => {
  const post = await assertOwnership(req.params.id, req.user._id);

  // If post is PUBLISHED, enforce step-up OTP validation
  if (post.status === 'PUBLISHED') {
    const code = req.body?.code || req.query?.code || req.headers['x-delete-code'];

    if (!code) {
      return res.status(400).json({
        success: false,
        code: 'DELETE_CODE_REQUIRED',
        message: 'Verification code is required to delete a published story.',
      });
    }

    if (!post.deleteOtpHash || !post.deleteOtpExpires || post.deleteOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        code: 'DELETE_CODE_EXPIRED',
        message: 'Verification code has expired or is invalid. Please request a new code.',
      });
    }

    const isMatch = await verifyOTP(code, post.deleteOtpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        code: 'DELETE_CODE_INVALID',
        message: 'Invalid verification code. Please try again.',
      });
    }

    // OTP matches cleanly -> clear fields
    post.deleteOtpHash = null;
    post.deleteOtpExpires = null;
    await post.save();
  }

  // Fetch user settings to respect auto-delete preferences
  const user = await User.findById(req.user._id);

  // Soft Delete!
  post.deleted = true;
  post.deletedAt = new Date();

  // Apply 30-day auto-delete TTL if user enabled it (default: true)
  if (user?.autoDeleteTrash !== false) {
    post.autoDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  } else {
    post.autoDeleteAt = null;
  }

  await post.save();

  res.status(200).json({
    success: true,
    message: 'Post moved to trash successfully.',
  });
};

/**
 * PATCH /api/posts/:id/status
 * Authorization: Bearer token required + must be post owner
 * Body: { status: 'DRAFT' | 'PUBLISHED' }
 */
export const toggleStatus = async (req, res) => {
  const post = await assertOwnership(req.params.id, req.user._id);

  const { status } = req.body;
  post.status = status;
  await post.save();

  res.status(200).json({
    success: true,
    message: `Post is now ${status}.`,
    data: { _id: post._id, status: post.status },
  });
};

/**
 * POST /api/posts/:id/request-delete
 * Authorization: Bearer token required + must be post owner
 */
export const requestDeletePostOtp = async (req, res) => {
  const post = await assertOwnership(req.params.id, req.user._id);

  if (post.status !== 'PUBLISHED') {
    throw new AppError('Verification codes are only required for published stories.', 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  const otp = generateOTP();
  const hash = await hashOTP(otp);

  post.deleteOtpHash = hash;
  post.deleteOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
  await post.save();

  // Send deletion verification alert email
  await sendPostDeletionOTPEmail(user.email, user.name, post.title, otp);

  res.status(200).json({
    success: true,
    message: 'Verification code sent to your registered email address.',
  });
};
