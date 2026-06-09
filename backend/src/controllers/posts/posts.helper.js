import Post from '../../models/Post.model.js';
import { AppError } from '../../middleware/error.middleware.js';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

/**
 * Parse and clamp pagination query params.
 */
export const parsePagination = (query) => {
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
export const assertOwnership = async (postId, userId) => {
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
