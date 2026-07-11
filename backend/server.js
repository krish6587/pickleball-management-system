import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournament.js';
import matchRoutes from './routes/match.js';
import aiRoutes from './routes/ai.js';
import { generalLimiter } from './middleware/rateLimiter.js';

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Trust proxy (needed for rate limiting behind Vercel/reverse proxy)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS — restrict to frontend domain in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '*')
    : '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser with size limit (prevent DoS with large payloads)
app.use(express.json({ limit: '1mb' }));

// General rate limiting for all API routes
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/ai', aiRoutes);

// Base Endpoint
app.get('/', (req, res) => {
  res.send('Pickleball Tournament API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
