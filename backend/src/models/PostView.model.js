import mongoose from 'mongoose';

/**
 * PostView Schema
 * Logs unique page view entries to enforce rolling 24-hour deduplication rules
 * and compute unique visitor count accurately.
 */
const postViewSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visitorId: {
      type: String,
      default: null,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for fast 24h lookup queries
postViewSchema.index({ postId: 1, userId: 1, viewedAt: -1 });
postViewSchema.index({ postId: 1, visitorId: 1, viewedAt: -1 });

const PostView = mongoose.model('PostView', postViewSchema);

export default PostView;
