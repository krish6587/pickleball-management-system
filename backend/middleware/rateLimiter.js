import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Auth endpoints: strict in production, lenient in dev for testing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 15, // 100 in dev, 15 in production
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints: 10 requests per minute
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many AI requests. Please wait a minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 1000 requests per 15 minutes in prod, 2000 in dev
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 2000 : 1000,
  message: { message: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
