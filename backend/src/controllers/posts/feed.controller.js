import mongoose from 'mongoose';
import Post, { PREDEFINED_CATEGORIES } from '../../models/Post.model.js';
import Bookmark from '../../models/Bookmark.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { parsePagination } from './posts.helper.js';

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
