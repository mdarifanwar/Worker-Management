const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { body } = require('express-validator');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');
const { validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();
const { emailTransporter } = require('../config/otpTransport');

// Registration with logo upload
// Registration with email OTP verification
const otpStore = {};
router.post(
	'/register/send-otp',
	[body('email').isEmail().withMessage('Valid email required')],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email } = req.body;
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
		if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
			emailTransporter.sendMail({
				from: process.env.GMAIL_USER,
				to: email,
				subject: 'Your OTP Code',
				text: `Your OTP is ${otp}`
			}, (err, info) => {
				if (err) {
					console.error(err);
					return res.status(500).json({ message: 'Failed to send OTP via email' });
				}
				res.json({ message: 'OTP sent to your email' });
			});
		} else {
			console.log(`Registration OTP for email ${email}: ${otp}`);
			res.json({ message: 'OTP sent to your email (check console in dev mode)' });
		}
	}
);

router.post('/register', registerLimiter, upload.single('logo'), handleUploadError, registerValidation, async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	const { email, otp } = req.body;
	const otpData = otpStore[email];
	if (!otpData || otpData.otp !== otp || Date.now() > otpData.expires) {
		return res.status(400).json({ message: 'Invalid or expired OTP' });
	}
	delete otpStore[email];
	next();
}, register);

// Login with validation and rate limiting
router.post('/login', loginLimiter, loginValidation, (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
}, login);
router.post('/logout', (req, res) => {
	// Clear auth cookie
	res.clearCookie('token');
	res.json({ message: 'Logged out' });
});
router.get('/profile', auth, getProfile);

module.exports = router;