import mongoose from 'mongoose';

/**
 * Bookmark Schema
 * 
 * Maps a User to a Post they have bookmarked, along with a personal note
 * and the timestamp of when they bookmarked it.
 */
const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a bookmark'],
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required for a bookmark'],
      index: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt represents bookmarkedAt
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Enforce unique combination of user and post
bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
