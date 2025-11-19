const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // If the database is not connected, fail fast with 503 instead of
    // allowing Mongoose to buffer the query and timeout after ~10s.
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      console.error('[auth] Database not connected (readyState=' + mongoose.connection.readyState + ')');
      return res.status(503).json({ message: 'Service unavailable: database not connected' });
    }
    // Support token via Authorization header (Bearer) or HttpOnly cookie `token`
    let token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
        // Log for debugging authentication issues
        console.warn('[auth] No token found in request');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      console.warn('[auth] JWT verification failed:', err.message);
      return res.status(401).json({ message: 'Token is not valid' });
    }
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.warn(`[auth] No user found for id: ${decoded.userId}`);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[auth] unexpected error in auth middleware:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;