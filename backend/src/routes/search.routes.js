import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getSuggestions,
  getHistory,
  saveSearch,
  deleteHistoryItem,
} from '../controllers/search.controller.js';

const router = Router();

// Public auto-complete suggestions endpoint
router.get('/suggestions', getSuggestions);

// Authenticated search history endpoints
router.get('/history', verifyToken, getHistory);
router.post('/history', verifyToken, saveSearch);
router.delete('/history/:query', verifyToken, deleteHistoryItem);

export default router;
