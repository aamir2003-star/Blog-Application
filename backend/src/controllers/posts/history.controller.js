import ReadingHistory from '../../models/ReadingHistory.model.js';
import { AppError } from '../../middleware/error.middleware.js';

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
