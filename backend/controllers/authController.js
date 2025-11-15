const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const { companyName, email, password, phone, address } = req.body;
    let logoPath = '';
    if (req.file) {
      logoPath = `/uploads/${req.file.filename}`;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      companyName,
      email,
      password,
      phone,
      address,
      logo: logoPath
    });

    await user.save();

    // Generate token and set as HttpOnly cookie
    const token = generateToken(user._id);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };
    res.cookie('token', token, cookieOptions);
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        logo: user.logo
      }
    });
  } catch (error) {
    console.error('[register] Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log(`[auth] Login attempt for identifier: ${identifier}`);

    // Find user by email or phone
    const user = await User.findOne({ $or: [ { email: identifier }, { phone: identifier } ] });
    if (!user) {
      console.error(`[login] No user found for identifier: ${identifier}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log(`[login] Password match for ${identifier}: ${isMatch}`);
    if (!isMatch) {
      console.error(`[login] Invalid password for identifier: ${identifier}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token and set as HttpOnly cookie
    const token = generateToken(user._id);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };
    res.cookie('token', token, cookieOptions);
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        logo: user.logo
      }
    });
  } catch (error) {
    console.error('[login] Error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      console.warn('[authController] getProfile called without req.user');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // req.user may already be a user document set by auth middleware
    let user = req.user;
    // If req.user is only an id or plain object, attempt to fetch latest from DB
    if (!user._id && user.id) {
      user = await User.findById(user.id).select('-password');
    }
    if (!user) {
      console.warn('[authController] user not found when fetching profile');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(user);
  } catch (error) {
    console.error('[authController] getProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};
