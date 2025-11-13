const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Support token via Authorization header (Bearer) or HttpOnly cookie `token`
    let token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
        // no token present — log headers only when explicitly debugging to avoid log spam
        if (process.env.DEBUG_AUTH === 'true') {
          try {
            console.warn('[auth] No token found in Authorization header or cookies');
            console.warn('[auth] Authorization header:', req.headers && req.headers.authorization);
            console.warn('[auth] Cookie header:', req.headers && req.headers.cookie);
          } catch (e) {
            console.warn('[auth] error while logging headers', e);
          }
        }
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