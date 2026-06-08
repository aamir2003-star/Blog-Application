import { Router } from 'express';
import authRoutes from './auth.routes.js';
import postRoutes from './post.routes.js';
import uploadRoutes from './upload.routes.js';
import searchRoutes from './search.routes.js';

const router = Router();

/**
 * Root API Router
 * All routes are prefixed with /api in app.js.
 *
 * /api/auth  → Authentication (register, login, OAuth, refresh, logout, me)
 * /api/posts → Blog posts (CRUD, public feed, dashboard)
 * /api/uploads → Image uploads (Cloudinary)
 * /api/search → Autocomplete search & history sync
 */
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/uploads', uploadRoutes);
router.use('/search', searchRoutes);

/**
 * GET /api/health
 * Simple health check endpoint.
 * Useful for load balancers, Docker HEALTHCHECK, and Postman smoke tests.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Engineering Blog API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
