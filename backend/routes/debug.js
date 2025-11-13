const express = require('express');
const router = express.Router();

// Temporary debug endpoint — returns headers and parsed cookies
// WARNING: Do NOT leave this enabled in production. Remove after debugging.
router.get('/headers', (req, res) => {
  try {
    const safeHeaders = {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer,
      authorization: req.headers.authorization || null,
      cookie: req.headers.cookie || null,
      'x-forwarded-for': req.headers['x-forwarded-for'] || null,
    };
    return res.json({ headers: safeHeaders, cookies: req.cookies || {} });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read headers', details: err.message });
  }
});

module.exports = router;
