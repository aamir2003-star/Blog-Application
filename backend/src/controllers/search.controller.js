import Post from '../models/Post.model.js';
import User from '../models/User.model.js';
import SearchHistory from '../models/SearchHistory.model.js';

const PREDEFINED_CATEGORIES = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
  'System Design', 'DevOps', 'Databases', 'Cloud & AWS', 'Security',
  'Algorithms & DSA', 'Career & Growth', 'Open Source', 'Other'
];

/**
 * GET /api/search/suggestions
 * Retrieve auto-complete suggestions matching titles, categories, and authors.
 */
export const getSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(200).json({ success: true, data: [] });
  }

  const queryStr = q.trim();

  // 1. Fetch matching published posts
  const postsPromise = Post.find({
    deleted: { $ne: true },
    status: 'PUBLISHED',
    title: { $regex: queryStr, $options: 'i' }
  })
    .select('title slug')
    .limit(5);

  // 2. Fetch matching creators (authors)
  const authorsPromise = User.find({
    role: 'CREATOR',
    name: { $regex: queryStr, $options: 'i' }
  })
    .select('name avatar')
    .limit(3);

  // 3. Fetch distinct categories from published posts
  const usedCategoriesPromise = Post.distinct('category', {
    status: 'PUBLISHED',
    deleted: { $ne: true },
  });

  const [posts, authors, usedCategories] = await Promise.all([
    postsPromise,
    authorsPromise,
    usedCategoriesPromise
  ]);

  // Filter categories
  const matchedCategories = PREDEFINED_CATEGORIES.concat(usedCategories)
    .filter(cat => cat.toLowerCase().includes(queryStr.toLowerCase()));
  const uniqueCategories = [...new Set(matchedCategories)].slice(0, 3);

  // Combine suggestions into a unified array
  const suggestions = [];

  // Add categories
  uniqueCategories.forEach(cat => {
    suggestions.push({
      type: 'category',
      text: cat
    });
  });

  // Add authors
  authors.forEach(auth => {
    suggestions.push({
      type: 'author',
      text: auth.name,
      payload: { id: auth._id, avatar: auth.avatar }
    });
  });

  // Add posts
  posts.forEach(post => {
    suggestions.push({
      type: 'post',
      text: post.title,
      payload: { slug: post.slug }
    });
  });

  res.status(200).json({
    success: true,
    data: suggestions
  });
};

/**
 * GET /api/search/history
 * Retrieve the current user's search history (limited to 10).
 */
export const getHistory = async (req, res) => {
  const userId = req.user._id;

  const history = await SearchHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: history
  });
};

/**
 * POST /api/search/history
 * Save a search query to the database for the current user.
 */
export const saveSearch = async (req, res) => {
  const { query } = req.body;
  const userId = req.user._id;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Query string is required.' });
  }

  const cleanQuery = query.trim();

  // Deduplicate: remove any existing document with the same query for this user
  await SearchHistory.deleteMany({ userId, query: cleanQuery });

  // Add new history entry
  await SearchHistory.create({ userId, query: cleanQuery });

  // Limit to max 10 entries per user
  const count = await SearchHistory.countDocuments({ userId });
  if (count > 10) {
    const oldest = await SearchHistory.find({ userId })
      .sort({ createdAt: 1 })
      .limit(count - 10);
    const oldestIds = oldest.map(item => item._id);
    await SearchHistory.deleteMany({ _id: { $in: oldestIds } });
  }

  res.status(200).json({
    success: true,
    message: 'Search query saved.'
  });
};

/**
 * DELETE /api/search/history/:query
 * Delete a specific search query from the user's history.
 */
export const deleteHistoryItem = async (req, res) => {
  const { query } = req.params;
  const userId = req.user._id;

  await SearchHistory.deleteMany({ userId, query: query.trim() });

  res.status(200).json({
    success: true,
    message: 'History item removed.'
  });
};
