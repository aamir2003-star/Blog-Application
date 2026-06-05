import mongoose from 'mongoose';

/**
 * PostRead Schema
 * Logs verified read interactions (30 seconds active reading OR 70% scroll depth)
 */
const postReadSchema = new mongoose.Schema(
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
    timeSpent: {
      type: Number,
      required: true, // in seconds
    },
    scrollPercentage: {
      type: Number,
      required: true,
    },
    readAt: {
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

// Compound indexes for quick deduplication checks
postReadSchema.index({ postId: 1, userId: 1 });
postReadSchema.index({ postId: 1, visitorId: 1 });

const PostRead = mongoose.model('PostRead', postReadSchema);

export default PostRead;
