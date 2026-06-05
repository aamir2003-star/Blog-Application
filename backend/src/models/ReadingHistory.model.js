import mongoose from 'mongoose';

/**
 * Reading History Schema
 * 
 * Tracks unique articles visited by a user, including the timestamp 
 * of their most recent visit.
 */
const readingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for reading history'],
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required for reading history'],
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Enforce unique combination of user and post to deduplicate history
readingHistorySchema.index({ userId: 1, postId: 1 }, { unique: true });

const ReadingHistory = mongoose.model('ReadingHistory', readingHistorySchema);

export default ReadingHistory;
