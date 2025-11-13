const express = require('express');
const User = require('../models/User');
const { resetRequestValidation, resetPasswordValidation } = require('../middleware/resetValidation');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// In-memory store for OTPs (use Redis or DB in production)
const otpStore = {};

const router = express.Router();

// Request password reset (send OTP)
router.post('/request-reset', resetRequestValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, phone } = req.body;
  const user = await User.findOne(email ? { email } : { phone });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[user._id] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  // Send OTP via email or SMS
  if (phone) {
    // For development, log OTP to console. Integrate SMS provider for production.
    console.log(`OTP for phone ${phone}: ${otp}`);
    res.json({ message: 'OTP sent to your phone number (check console in dev mode)' });
  } else if (email) {
    // For development, log OTP to console. Integrate email provider for production.
    console.log(`OTP for email ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email (check console in dev mode)' });
  } else {
    res.status(400).json({ message: 'No valid phone or email provided' });
  }
});

// Reset password with OTP
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, phone, otp, newPassword } = req.body;
  const user = await User.findOne(email ? { email } : { phone });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const otpData = otpStore[user._id];
  if (!otpData || otpData.otp !== otp || Date.now() > otpData.expires) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.password = newPassword;
  await user.save();
  delete otpStore[user._id];
  res.json({ message: 'Password reset successful' });
});

module.exports = router;
