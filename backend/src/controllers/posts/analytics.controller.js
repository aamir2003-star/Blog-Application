import Post from '../../models/Post.model.js';
import PostView from '../../models/PostView.model.js';
import PostRead from '../../models/PostRead.model.js';
import ReadingHistory from '../../models/ReadingHistory.model.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * POST /api/posts/:id/view
 * Optional Authorization
 * Body: { visitorId }
 *
 * Records a unique view once per rolling 24-hour window per unique visitor/article.
 * Excludes the author's own visits.
 */
export const recordPostView = async (req, res) => {
  const { visitorId } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  // Soft Auth Identity check
  const userId = req.user?._id;
  const viewerId = userId ? userId.toString() : visitorId;

  if (!viewerId) {
    throw new AppError('Visitor identity is required to track views.', 400);
  }

  // Author Exclusion Rule
  const authorIdStr = post.authorId?._id 
    ? post.authorId._id.toString() 
    : post.authorId.toString();
  if (viewerId === authorIdStr) {
    return res.status(200).json({
      success: true,
      message: 'Author visit ignored for view counting.',
    });
  }

  // If user is logged in, record/update their unique reading history
  if (userId) {
    await ReadingHistory.findOneAndUpdate(
      { userId, postId: post._id },
      { viewedAt: new Date() },
      { upsert: true }
    ).catch(err => console.error('Failed to update reading history:', err));
  }

  // Construct query to check for duplicate views in last 24h
  const identityQuery = userId 
    ? { userId } 
    : { visitorId };

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingView = await PostView.findOne({
    postId: post._id,
    ...identityQuery,
    viewedAt: { $gte: yesterday },
  });

  if (existingView) {
    return res.status(200).json({
      success: true,
      message: 'View already recorded within rolling 24-hour window.',
    });
  }

  // Log the new view document
  await PostView.create({
    postId: post._id,
    userId: userId || null,
    visitorId: visitorId || null,
    viewedAt: new Date(),
  });

  // Increment totalViews
  post.totalViews = (post.totalViews || 0) + 1;

  // Check if this is the visitor's first-ever view on this post to increment uniqueVisitors
  const totalViewsByVisitor = await PostView.countDocuments({
    postId: post._id,
    ...identityQuery,
  });

  if (totalViewsByVisitor === 1) {
    post.uniqueVisitors = (post.uniqueVisitors || 0) + 1;
  }

  await post.save();

  res.status(200).json({
    success: true,
    message: 'View recorded successfully.',
    data: {
      totalViews: post.totalViews,
      uniqueVisitors: post.uniqueVisitors,
    },
  });
};

/**
 * POST /api/posts/:id/read
 * Optional Authorization
 * Body: { visitorId, timeSpent, scrollPercentage }
 *
 * Records reading statistics (30s timeSpent OR 70% scrollPercentage).
 * Excludes author self-views.
 */
export const recordPostRead = async (req, res) => {
  const { visitorId, timeSpent, scrollPercentage } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const userId = req.user?._id;
  const viewerId = userId ? userId.toString() : visitorId;

  if (!viewerId) {
    throw new AppError('Visitor identity is required to track reading depth.', 400);
  }

  // Author Exclusion Rule
  const authorIdStr = post.authorId?._id 
    ? post.authorId._id.toString() 
    : post.authorId.toString();
  if (viewerId === authorIdStr) {
    return res.status(200).json({
      success: true,
      message: 'Author visit ignored for read tracking.',
    });
  }

  const identityQuery = userId 
    ? { userId } 
    : { visitorId };

  // Validate threshold requirements
  const hasMetThreshold = (timeSpent && timeSpent >= 30) || (scrollPercentage && scrollPercentage >= 70);
  if (!hasMetThreshold) {
    return res.status(400).json({
      success: false,
      message: 'Read threshold not met (requires >= 30s spent or >= 70% scrolled).',
    });
  }

  // Check if a read record already exists for this post + visitor
  const existingRead = await PostRead.findOne({
    postId: post._id,
    ...identityQuery,
  });

  if (existingRead) {
    // Update read stats if they are higher
    let updated = false;
    if (timeSpent && timeSpent > existingRead.timeSpent) {
      existingRead.timeSpent = timeSpent;
      updated = true;
    }
    if (scrollPercentage && scrollPercentage > existingRead.scrollPercentage) {
      existingRead.scrollPercentage = scrollPercentage;
      updated = true;
    }
    if (updated) {
      await existingRead.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Read stats updated.',
      data: { reads: post.reads },
    });
  }

  // Log new verified PostRead document
  await PostRead.create({
    postId: post._id,
    userId: userId || null,
    visitorId: visitorId || null,
    timeSpent: timeSpent || 0,
    scrollPercentage: scrollPercentage || 0,
    readAt: new Date(),
  });

  // Increment reads counter
  post.reads = (post.reads || 0) + 1;
  await post.save();

  res.status(200).json({
    success: true,
    message: 'Read recorded successfully.',
    data: { reads: post.reads },
  });
};
