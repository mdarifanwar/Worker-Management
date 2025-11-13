const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Google OAuth login
// Wrap the passport authenticate call so we can capture/log the redirect URL
router.get('/google', (req, res, next) => {
  console.log('[Google OAuth] /api/auth/google hit');

  // Monkeypatch res.redirect temporarily to capture the outbound redirect
  const originalRedirect = res.redirect.bind(res);
  res.redirect = function (url) {
    try {
      console.log('[Google OAuth] About to redirect to:', url);
      // If the redirect target is Google's OAuth endpoint but the `scope` query
      // parameter is missing for some reason, append it as a temporary dev
      // safeguard so Google receives the required scopes. This keeps the
      // existing behavior but ensures the request isn't rejected for missing
      // scope while we debug the root cause.
      if (typeof url === 'string' && url.includes('accounts.google.com') && !url.includes('scope=')) {
        const sep = url.includes('?') ? '&' : '?';
        const appended = url + sep + 'scope=' + encodeURIComponent('profile email');
        console.log('[Google OAuth] Appending missing scope, redirecting to:', appended);
        return originalRedirect(appended);
      }
    } catch (e) {
      console.error('[Google OAuth] Failed to log/modify redirect URL', e);
    }
    return originalRedirect(url);
  };

  // Invoke passport.authenticate directly so the patched res.redirect is used
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  console.log('[Google OAuth] /api/auth/google/callback hit - query:', req.query);
  next();
}, passport.authenticate('google', { failureRedirect: (process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:3000') + '/login' }), async (req, res) => {
  try {
    // User info from Google
    const googleUser = req.user;
    console.log('[Google OAuth] authenticated user:', googleUser && googleUser.email);
    // Find or create user in DB
    let user = await User.findOne({ email: googleUser.email });
    if (!user) {
      user = new User({
        companyName: googleUser.companyName || '',
        email: googleUser.email,
        password: jwt.sign({ email: googleUser.email }, process.env.JWT_SECRET || 'fallback_secret'), // random password
        logo: googleUser.picture || '',
        phone: '',
        address: ''
      });
      await user.save();
    }
    // Issue JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    const frontendOrigin = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:3000';

    if (process.env.NODE_ENV === 'production') {
      // In production set HttpOnly cookie and redirect without token in URL
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      res.cookie('token', token, cookieOptions);
      res.redirect(`${frontendOrigin.replace(/\/$/, '')}/login`);
    } else {
      // Development fallback: browsers sometimes block cross-site Set-Cookie during
      // OAuth redirects. For local dev we include the token in the redirect so the
      // frontend can pick it up and set auth headers. This is NOT recommended for
      // production.
      res.redirect(`${frontendOrigin.replace(/\/$/, '')}/login?token=${token}`);
    }
  } catch (err) {
    console.error('[Google OAuth] callback error:', err);
    const frontendOrigin = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:3000';
    res.redirect(`${frontendOrigin.replace(/\/$/, '')}/login`);
  }
});

module.exports = router;
