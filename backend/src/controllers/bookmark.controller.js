import Bookmark from '../models/Bookmark.model.js';
import Post from '../models/Post.model.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Toggle bookmark status for a post.
 * POST /api/posts/:id/bookmark
 */
export const toggleBookmark = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user._id;

  // Verify post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Story not found.', 404);
  }

  // Check if bookmark already exists
  const existingBookmark = await Bookmark.findOne({ userId, postId });

  if (existingBookmark) {
    // Delete if it exists
    await Bookmark.deleteOne({ _id: existingBookmark._id });
    return res.status(200).json({
      success: true,
      message: 'Story removed from library.',
      bookmarked: false,
    });
  } else {
    // Create if it doesn't exist
    await Bookmark.create({ userId, postId });
    return res.status(200).json({
      success: true,
      message: 'Story added to library.',
      bookmarked: true,
    });
  }
};

/**
 * Update personal note for a bookmarked post.
 * PATCH /api/posts/:id/bookmark/note
 */
export const updateBookmarkNote = async (req, res) => {
  const { id: postId } = req.params;
  const { note } = req.body;
  const userId = req.user._id;

  const bookmark = await Bookmark.findOne({ userId, postId });
  if (!bookmark) {
    throw new AppError('Bookmark not found. Save the story to your library first.', 404);
  }

  bookmark.note = note !== undefined ? note.trim() : '';
  await bookmark.save();

  res.status(200).json({
    success: true,
    message: 'Note updated successfully.',
    data: bookmark,
  });
};

/**
 * Fetch all bookmarked stories for the current user.
 * GET /api/posts/bookmarks/list
 */
export const getBookmarks = async (req, res) => {
  const userId = req.user._id;

  // Find bookmarks, sort by bookmarkedAt (createdAt) descending
  const bookmarks = await Bookmark.find({ userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'postId',
      match: { deleted: { $ne: true } }, // Don't return soft-deleted posts
      populate: {
        path: 'authorId',
        select: 'name avatar role',
      },
    });

  // Filter out any populated items where the referenced post was deleted/null
  const activeBookmarks = bookmarks.filter(b => b.postId !== null);

  res.status(200).json({
    success: true,
    data: activeBookmarks,
  });
};
