import mongoose from 'mongoose';
import Post from '../../models/Post.model.js';
import { parsePagination } from './posts.helper.js';

/**
 * GET /api/posts/my
 * Authorization: Bearer token required
 *
 * Returns ALL posts (drafts + published) for the authenticated creator.
 * Supports pagination.
 */
export const getMyPosts = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status } = req.query; // Optional: filter by DRAFT or PUBLISHED

  // Dashboard filter to exclude "completely empty" drafts.
  // A draft is empty if it has only default placeholders and empty values.
  // We want to fetch drafts only if they are NON-EMPTY, or if the status is PUBLISHED.
  const baseFilter = { 
    authorId: new mongoose.Types.ObjectId(req.user._id),
    deleted: { $ne: true },
    $or: [
      { status: 'PUBLISHED' },
      {
        status: 'DRAFT',
        $or: [
          { title: { $nin: ['Untitled Draft', 'Untitled', '', null] } },
          { coverImage: { $nin: ['', null] } },
          { seoKeywords: { $ne: '' } },
          { excerpt: { $nin: ['Draft excerpt...', '', null] } },
          { category: { $nin: ['Other', '', null] } },
          {
            $and: [
              { htmlContent: { $exists: true } },
              { htmlContent: { $nin: ['', '<p></p>', null] } },
              { htmlContent: { $not: /^(<!--[^>]*-->|\s|<p>\s*<\/p>)*$/ } }
            ]
          }
        ]
      }
    ]
  };

  const filter = { ...baseFilter };

  // If a specific status filter is requested by query parameter (e.g. status=DRAFT),
  // we combine it with our dashboard filter condition.
  if (status && ['DRAFT', 'PUBLISHED'].includes(status.toUpperCase())) {
    filter.status = status.toUpperCase();
  }

  // Compile overall creator analytics using MongoDB Aggregation Pipeline
  const [posts, total, analyticsResult] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
    Post.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ['$totalViews', 0] } },
          publishedCount: { $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] } },
          draftsCount: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const analytics = analyticsResult[0] || {
    totalViews: 0,
    publishedCount: 0,
    draftsCount: 0,
  };

  res.status(200).json({
    success: true,
    data: posts,
    analytics,
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
