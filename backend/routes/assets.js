const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Returns a base64 data URL for an uploaded asset (logo).
// Query: ?path=filename.ext
router.get('/logo-base64', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Missing path parameter' });

    // sanitize the path: only allow a filename (no ../)
    const basename = path.basename(filePath);
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const fullPath = path.join(uploadsDir, basename);

    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

    const buffer = fs.readFileSync(fullPath);
    // detect mime type from extension (basic)
    const ext = path.extname(basename).toLowerCase();
    let mime = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    if (ext === '.gif') mime = 'image/gif';
    if (ext === '.svg') mime = 'image/svg+xml';

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64}`;
    res.json({ data: dataUrl });
  } catch (err) {
    console.error('Error in /api/assets/logo-base64:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
