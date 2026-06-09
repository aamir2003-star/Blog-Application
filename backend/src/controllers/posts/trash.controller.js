import Post from '../../models/Post.model.js';
import User from '../../models/User.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { parsePagination, assertOwnership } from './posts.helper.js';

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
