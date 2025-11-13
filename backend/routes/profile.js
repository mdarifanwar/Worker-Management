const express = require('express');
const { updateProfile } = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Update profile with logo upload
router.put('/', auth, upload.single('logo'), handleUploadError, updateProfile);

module.exports = router;
