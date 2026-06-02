import mongoose from 'mongoose';
import Post, { PREDEFINED_CATEGORIES } from '../models/Post.model.js';
import User from '../models/User.model.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import { AppError } from '../middleware/error.middleware.js';

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
  const filter = { status: 'PUBLISHED' };

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
    sortObj.views = -1;
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
  const query = isObjectId ? { _id: slug } : { slug };

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
  } else {
    // Increment view count asynchronously in the background for high performance
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(err => {
      console.error('Failed to increment post views:', err);
    });
    post.views = (post.views || 0) + 1;
  }

  res.status(200).json({ success: true, data: post });
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
  const filter = { 
    authorId: req.user._id,
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
      { $match: filter },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
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

  await Post.findByIdAndDelete(post._id);

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully.',
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
