import express from 'express';
import {
  sendOtpEmail,
  verifyOtpEmail,
  completeProfile,
  loginUser,
  verifyLoginOtp,
  verify2faAdmin,
  forgotPasswordRequest,
  forgotPasswordReset,
  getUserProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/send-otp-email', authLimiter, sendOtpEmail);
router.post('/verify-otp-email', authLimiter, verifyOtpEmail);
router.post('/complete-profile', authLimiter, completeProfile);
router.post('/login', authLimiter, loginUser);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);
router.post('/verify-2fa-admin', authLimiter, verify2faAdmin);
router.post('/forgot-password-request', authLimiter, forgotPasswordRequest);
router.post('/forgot-password-reset', authLimiter, forgotPasswordReset);
router.get('/me', protect, getUserProfile);

export default router;

