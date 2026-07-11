import express from 'express';
import { askAssistant } from '../controllers/aiController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Route for asking the AI assistant (public chatbot with optional auth)
router.post('/ask', aiLimiter, optionalAuth, askAssistant);

// Public route for analyzing tournament (optional authorization)
router.post('/analyze', aiLimiter, optionalAuth, askAssistant);

export default router;

