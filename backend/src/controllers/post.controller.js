import mongoose from 'mongoose';
import Post, { PREDEFINED_CATEGORIES } from '../models/Post.model.js';
import User from '../models/User.model.js';
import PostView from '../models/PostView.model.js';
import PostRead from '../models/PostRead.model.js';
import Bookmark from '../models/Bookmark.model.js';
import ReadingHistory from '../models/ReadingHistory.model.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateOTP, hashOTP, verifyOTP, sendPostDeletionOTPEmail } from '../utils/otp.utils.js';

/**
 * Post Controller — all blog post operations.
 *
 * Role escalation rule:
 *   Any authenticated user can create a post.
 *   On first post creation, their role is automatically promoted
 *   from VISITOR → CREATOR.
 *
 * Ownership rule:
 *   PUT, DELETE, PATCH (status toggle) require the request user
 *   to be the post's original author.
 *
 * Methods:
 *  getAllPublished    GET    /api/posts               (Public)
 *  getBySlug         GET    /api/posts/:slug          (Public)
 *  getMyPosts        GET    /api/posts/my             (Auth required)
 *  createPost        POST   /api/posts                (Auth required)
 *  updatePost        PUT    /api/posts/:id            (Auth + Owner)
 *  deletePost        DELETE /api/posts/:id            (Auth + Owner)
 *  toggleStatus      PATCH  /api/posts/:id/status     (Auth + Owner)
 *  getCategories     GET    /api/posts/categories     (Public)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Parse and clamp pagination query params.
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Verify the requesting user owns the post.
 * Throws 404 if the post doesn't exist, 403 if they don't own it.
 */
const assertOwnership = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found.', 404);

  if (post.authorId.toString() !== userId.toString()) {
    throw new AppError(
      'Access denied. You can only modify your own posts.',
      403
    );
  }

  return post;
};

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/posts
 * Query params: page, limit, category, search
 *
 * Returns published posts with author name and avatar populated.
 * Supports filtering by category and full-text search on title + excerpt.
 */
export const getAllPublished = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { category, search, sort } = req.query;

  // Build filter — only show PUBLISHED posts to the public
  const filter = { status: 'PUBLISHED', deleted: { $ne: true } };

  if (category) {
    filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (search && search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { excerpt: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const sortObj = {};
  if (sort === 'views') {
    sortObj.totalViews = -1;
  } else {
    sortObj.createdAt = -1;
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('authorId', 'name avatar') // Only expose public author fields
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * GET /api/posts/categories
 *
 * Returns the predefined category list plus any custom categories
 * currently used in published posts (hybrid category system).
 */
export const getCategories = async (_req, res) => {
  // Get distinct categories currently used in published posts
  const usedCategories = await Post.distinct('category', {
    status: 'PUBLISHED',
    deleted: { $ne: true },
  });

  // Merge predefined + custom, remove duplicates
  const allCategories = [
    ...new Set([...PREDEFINED_CATEGORIES, ...usedCategories]),
  ].sort();

  res.status(200).json({ success: true, data: allCategories });
};

/**
 * GET /api/posts/:slug
 *
 * Fetch a single post by its SEO slug.
 * Only published posts are accessible publicly.
 * Creators can view their own drafts by hitting this endpoint while authenticated
 * (the route handler checks if the requester is the author).
 */
export const getBySlug = async (req, res) => {
  const { slug } = req.params;

  // Resolve post by either _id (if valid ObjectId) or slug (for human-readable URLs)
  const isObjectId = mongoose.isValidObjectId(slug);
  const query = isObjectId 
    ? { _id: slug, deleted: { $ne: true } } 
    : { slug, deleted: { $ne: true } };

  const post = await Post.findOne(query)
    .populate('authorId', 'name avatar role')
    .lean();

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  // If post is a draft, only the author can view it
  if (post.status === 'DRAFT') {
    // req.user is optionally set by a soft auth check in the route
    const requesterId = req.user?._id?.toString();
    const authorId = post.authorId?._id?.toString();

    if (!requesterId || requesterId !== authorId) {
      throw new AppError('Post not found.', 404); // Intentionally vague — don't reveal draft existence
    }
  }

  // Check if bookmarked if requester is logged in (optional auth)
  let isBookmarked = false;
  let bookmarkNote = '';
  if (req.user?._id) {
    const bookmark = await Bookmark.findOne({ userId: req.user._id, postId: post._id });
    if (bookmark) {
      isBookmarked = true;
      bookmarkNote = bookmark.note || '';
    }
  }

  res.status(200).json({ 
    success: true, 
    data: { 
      ...post, 
      isBookmarked,
      bookmarkNote
    } 
  });
};

// ─── Protected Routes (Auth Required) ────────────────────────────────────────

/**
 * GET /api/posts/my
 * Authorization: Bearer token required
 *
 * Returns ALL posts (drafts + published) for the authenticated creator.
 * Supports pagination.
 */
export const getMyPosts = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status } = req.query; // Optional: filter by DRAFT or PUBLISHED

  // Dashboard filter to exclude "completely empty" drafts.
  // A draft is empty if it has only default placeholders and empty values.
  // We want to fetch drafts only if they are NON-EMPTY, or if the status is PUBLISHED.
  const baseFilter = { 
    authorId: new mongoose.Types.ObjectId(req.user._id),
    deleted: { $ne: true },
    $or: [
      { status: 'PUBLISHED' },
      {
        status: 'DRAFT',
        $or: [
          { title: { $nin: ['Untitled Draft', 'Untitled', '', null] } },
          { coverImage: { $nin: ['', null] } },
          { seoKeywords: { $ne: '' } },
          { excerpt: { $nin: ['Draft excerpt...', '', null] } },
          { category: { $nin: ['Other', '', null] } },
          {
            $and: [
              { htmlContent: { $exists: true } },
              { htmlContent: { $nin: ['', '<p></p>', null] } },
              { htmlContent: { $not: /^(<!--[^>]*-->|\s|<p>\s*<\/p>)*$/ } }
            ]
          }
        ]
      }
    ]
  };

  const filter = { ...baseFilter };

  // If a specific status filter is requested by query parameter (e.g. status=DRAFT),
  // we combine it with our dashboard filter condition.
  if (status && ['DRAFT', 'PUBLISHED'].includes(status.toUpperCase())) {
    filter.status = status.toUpperCase();
  }

  // Compile overall creator analytics using MongoDB Aggregation Pipeline
  const [posts, total, analyticsResult] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
    Post.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalViews: {
            $sum: {
              $max: [
                { $ifNull: ['$totalViews', 0] },
                { $ifNull: ['$views', 0] }
              ]
            }
          },
          publishedCount: { $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] } },
          draftsCount: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const analytics = analyticsResult[0] || {
    totalViews: 0,
    publishedCount: 0,
    draftsCount: 0,
  };

  res.status(200).json({
    success: true,
    data: posts,
    analytics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * POST /api/posts
 * Authorization: Bearer token required (any role can post)
 * Body: { title, htmlContent, category, excerpt, coverImage?, seoKeywords?, status? }
 *
 * Role escalation:
 *   If the user is a VISITOR, they are automatically promoted to CREATOR
 *   when they create their first post.
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
  // Fetch the latest user and promote if still a VISITOR
  const user = await User.findById(req.user._id);
  if (user && user.role === 'VISITOR') {
    await user.promoteToCreator();
    // Note: The client should refresh its access token after this
    // to receive an updated role in the JWT payload.
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
 *
 * If the title changes, regenerates the slug (collision-safe, excludes current post).
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
 *
 * The "live toggle" — switches status without opening the editor.
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
 *
 * Generates and hashes a 6-digit delete OTP and emails it to the owner.
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

/**
 * POST /api/posts/:id/view
 * Optional Authorization
 * Body: { visitorId }
 *
 * Records a unique view once per rolling 24-hour window per unique visitor/article.
 * Excludes the author's own visits.
 */
export const recordPostView = async (req, res) => {
  const { visitorId } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  // Soft Auth Identity check
  const userId = req.user?._id;
  const viewerId = userId ? userId.toString() : visitorId;

  if (!viewerId) {
    throw new AppError('Visitor identity is required to track views.', 400);
  }

  // Author Exclusion Rule
  const authorIdStr = post.authorId.toString();
  if (viewerId === authorIdStr) {
    return res.status(200).json({
      success: true,
      message: 'Author visit ignored for view counting.',
    });
  }

  // If user is logged in, record/update their unique reading history
  if (userId) {
    await ReadingHistory.findOneAndUpdate(
      { userId, postId: post._id },
      { viewedAt: new Date() },
      { upsert: true }
    ).catch(err => console.error('Failed to update reading history:', err));
  }

  // Construct query to check for duplicate views in last 24h
  const identityQuery = userId 
    ? { userId } 
    : { visitorId };

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingView = await PostView.findOne({
    postId: post._id,
    ...identityQuery,
    viewedAt: { $gte: yesterday },
  });

  if (existingView) {
    return res.status(200).json({
      success: true,
      message: 'View already recorded within rolling 24-hour window.',
    });
  }

  // Log the new view document
  await PostView.create({
    postId: post._id,
    userId: userId || null,
    visitorId: visitorId || null,
    viewedAt: new Date(),
  });

  // Increment totalViews
  post.totalViews = (post.totalViews || 0) + 1;

  // Check if this is the visitor's first-ever view on this post to increment uniqueVisitors
  const totalViewsByVisitor = await PostView.countDocuments({
    postId: post._id,
    ...identityQuery,
  });

  if (totalViewsByVisitor === 1) {
    post.uniqueVisitors = (post.uniqueVisitors || 0) + 1;
  }

  await post.save();

  res.status(200).json({
    success: true,
    message: 'View recorded successfully.',
    data: {
      totalViews: post.totalViews,
      uniqueVisitors: post.uniqueVisitors,
    },
  });
};

/**
 * POST /api/posts/:id/read
 * Optional Authorization
 * Body: { visitorId, timeSpent, scrollPercentage }
 *
 * Records reading statistics (30s timeSpent OR 70% scrollPercentage).
 * Excludes author self-views.
 */
export const recordPostRead = async (req, res) => {
  const { visitorId, timeSpent, scrollPercentage } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const userId = req.user?._id;
  const viewerId = userId ? userId.toString() : visitorId;

  if (!viewerId) {
    throw new AppError('Visitor identity is required to track reading depth.', 400);
  }

  // Author Exclusion Rule
  const authorIdStr = post.authorId.toString();
  if (viewerId === authorIdStr) {
    return res.status(200).json({
      success: true,
      message: 'Author visit ignored for read tracking.',
    });
  }

  const identityQuery = userId 
    ? { userId } 
    : { visitorId };

  // Validate threshold requirements
  const hasMetThreshold = (timeSpent && timeSpent >= 30) || (scrollPercentage && scrollPercentage >= 70);
  if (!hasMetThreshold) {
    return res.status(400).json({
      success: false,
      message: 'Read threshold not met (requires >= 30s spent or >= 70% scrolled).',
    });
  }

  // Check if a read record already exists for this post + visitor
  const existingRead = await PostRead.findOne({
    postId: post._id,
    ...identityQuery,
  });

  if (existingRead) {
    // Update read stats if they are higher
    let updated = false;
    if (timeSpent && timeSpent > existingRead.timeSpent) {
      existingRead.timeSpent = timeSpent;
      updated = true;
    }
    if (scrollPercentage && scrollPercentage > existingRead.scrollPercentage) {
      existingRead.scrollPercentage = scrollPercentage;
      updated = true;
    }
    if (updated) {
      await existingRead.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Read stats updated.',
      data: { reads: post.reads },
    });
  }

  // Log new verified PostRead document
  await PostRead.create({
    postId: post._id,
    userId: userId || null,
    visitorId: visitorId || null,
    timeSpent: timeSpent || 0,
    scrollPercentage: scrollPercentage || 0,
    readAt: new Date(),
  });

  // Increment reads counter
  post.reads = (post.reads || 0) + 1;
  await post.save();

  res.status(200).json({
    success: true,
    message: 'Read recorded successfully.',
    data: { reads: post.reads },
  });
};

/**
 * GET /api/posts/trash
 * Authorization: Bearer token required
 *
 * Returns all soft-deleted posts for the authenticated creator.
 * Supports pagination.
 */
export const getTrashPosts = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {
    authorId: req.user._id,
    deleted: true,
  };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * PATCH /api/posts/:id/restore
 * Authorization: Bearer token required + must be post owner
 *
 * Restores a soft-deleted post back to active status, resetting deletion dates.
 */
export const restorePost = async (req, res) => {
  const post = await assertOwnership(req.params.id, req.user._id);

  if (!post.deleted) {
    throw new AppError('Story is not in the Trash Can.', 400);
  }

  // Restore post status flags
  post.deleted = false;
  post.deletedAt = null;
  post.autoDeleteAt = null; // Clear TTL expiration date

  await post.save();

  res.status(200).json({
    success: true,
    message: 'Story restored successfully.',
    data: post,
  });
};

/**
 * DELETE /api/posts/:id/permanent
 * Authorization: Bearer token required + must be post owner
 *
 * Physically and permanently purges a soft-deleted post from the database.
 */
export const permanentDeletePost = async (req, res) => {
  const post = await assertOwnership(req.params.id, req.user._id);

  if (!post.deleted) {
    throw new AppError('Only soft-deleted (trashed) publications can be permanently deleted.', 400);
  }

  await Post.findByIdAndDelete(post._id);

  res.status(200).json({
    success: true,
    message: 'Story permanently purged from database.',
  });
};

/**
 * Fetch all unique reading history records for the current user.
 * GET /api/posts/history
 */
export const getReadingHistory = async (req, res) => {
  const userId = req.user._id;

  const history = await ReadingHistory.find({ userId })
    .sort({ viewedAt: -1 })
    .populate({
      path: 'postId',
      match: { deleted: { $ne: true } },
      populate: {
        path: 'authorId',
        select: 'name avatar role',
      },
    });

  const activeHistory = history.filter(h => h.postId !== null);

  res.status(200).json({
    success: true,
    data: activeHistory,
  });
};

/**
 * Delete a specific reading history record for the current user.
 * DELETE /api/posts/history/:id
 */
export const deleteReadingHistoryEntry = async (req, res) => {
  const userId = req.user._id;
  const historyId = req.params.id;

  const record = await ReadingHistory.findOneAndDelete({ _id: historyId, userId });
  if (!record) {
    throw new AppError('Reading history record not found.', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Article removed from reading history.',
  });
};

