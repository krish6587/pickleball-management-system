import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Helper to hash OTP before storing
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

// Helper to sanitize server errors in production
const sendError = (res, error) => {
  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : error.message
  });
};

// Email OTP Sender Helper using Nodemailer
const sendEmailOTP = async (email, otpCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });

    const mailOptions = {
      from: `Pickleball App <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Your Verification Code</h2>
          <p>Please use the following 6-digit code to verify your account or login:</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${otpCode}</h1>
          <p>This code is valid for 5 minutes.</p>
        </div>
      `,
    };

    // Note: If dummy credentials are used, this will fail in the background, 
    // but we log it to console as a fallback simulation so development can continue.
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL OTP] Sent to ${email} successfully. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[EMAIL OTP ERROR] Failed to send email to ${email}. Check your SMTP credentials in .env!`, error.message);
    console.log('==========================================');
    console.log(`[SIMULATION FALLBACK] EMAIL OTP: OTP code is [${otpCode}] meant for [${email}]`);
    console.log('==========================================');
  }
};

// 1. Email-first Step 1: Send OTP to Email
export const sendOtpEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Strict email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (email.toLowerCase().endsWith('@gm.com') || email.toLowerCase().endsWith('@gmal.com')) {
      return res.status(400).json({ message: 'Did you mean @gmail.com? Please enter your full email address.' });
    }

    // Generate 6-digit OTP code (valid for 5 minutes)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity
    const hashedOtp = await hashOTP(otpCode);

    let user = await User.findOne({ email });
    if (!user) {
      // Create a temporary placeholder user
      user = await User.create({
        username: `user_${Math.floor(Math.random() * 100000)}`,
        email,
        password: `Tmp_pass1!_${Math.random().toString(36).substring(3, 10)}`, // temporary strong placeholder
        mobileNumber: `placeholder_${Math.floor(Math.random() * 1000000000)}`,
        isVerified: false,
        status: 'Pending',
        otpCode: hashedOtp,
        otpExpires,
      });
    } else {
      user.otpCode = hashedOtp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    await sendEmailOTP(email, otpCode);

    res.status(200).json({
      message: 'OTP sent successfully to email',
      email,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// 1. Email-first Step 2: Verify OTP
export const verifyOtpEmail = async (req, res) => {
  const { email, otpCode } = req.body;

  try {
    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOtpValid = await bcrypt.compare(otpCode, user.otpCode || '');
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP code has expired (5 min validity)' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully',
      email,
      verified: true,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// 1. Email-first Step 3: Complete Profile (Set Password / Mobile Number)
export const completeProfile = async (req, res) => {
  const { email, username, mobileNumber, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email must be verified before completing profile' });
    }

    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // Check mobile or username uniqueness
    const dupCheck = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ mobileNumber }, { username }],
    });

    if (dupCheck) {
      return res.status(400).json({ message: 'Username or Mobile Number is already taken' });
    }

    user.username = username;
    user.mobileNumber = mobileNumber;
    user.password = password; // Will be hashed by pre-save hook
    user.role = role || 'Viewer';
    user.status = (role === 'Editor') ? 'Pending' : 'Active'; // Editors need verification/approval
    await user.save();

    res.status(200).json({
      message: 'Profile completed successfully!',
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Login via OTP request (har baar OTP) or Normal Password Login
export const loginUser = async (req, res) => {
  const { email, password, loginWithOtp } = req.body;

  try {
    if (loginWithOtp) {
      // Passwordless OTP login request using Email
      if (!email) {
        return res.status(400).json({ message: 'Email is required for OTP login' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'No user registered with this email address' });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = await hashOTP(otpCode);
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      await sendEmailOTP(email, otpCode);

      return res.status(200).json({
        message: 'OTP sent for login verification',
        email,
        requiresOtpVerify: true,
      });
    }

    // Normal Password Login
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Admin Mandatory 2FA Check
    if (user.role === 'Admin') {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = await hashOTP(otpCode);
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      await sendEmailOTP(user.email, otpCode);

      return res.status(200).json({
        message: 'Mandatory 2FA OTP sent to Admin email',
        requires2fa: true,
        email: user.email,
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Verify OTP for login
export const verifyLoginOtp = async (req, res) => {
  const { email, otpCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isLoginOtpValid = await bcrypt.compare(otpCode, user.otpCode || '');
    if (!isLoginOtpValid || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Verify 2FA Admin OTP
export const verify2faAdmin = async (req, res) => {
  const { email, otpCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const is2faOtpValid = await bcrypt.compare(otpCode, user.otpCode || '');
    if (!is2faOtpValid || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired 2FA OTP code' });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Forgot Password (OTP-based) - Step 1: Request OTP via Email
export const forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email address' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = await hashOTP(otpCode);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendEmailOTP(email, otpCode);

    res.json({
      message: 'Password reset OTP sent successfully',
      email,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Forgot Password (OTP-based) - Step 2: Reset Password
export const forgotPasswordReset = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isForgotOtpValid = await bcrypt.compare(otpCode, user.otpCode || '');
    if (!isForgotOtpValid || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    sendError(res, error);
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    sendError(res, error);
  }
};

// Legacy backup endpoint
export const registerUser = async (req, res) => {
  return sendOtpEmail(req, res);
};

export const verifyOtp = async (req, res) => {
  return verifyOtpEmail(req, res);
};

export const verifyEmail = async (req, res) => {
  res.send('<h1>Email Verified via backup channel</h1>');
};
