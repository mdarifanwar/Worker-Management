const { body } = require('express-validator');

exports.registerValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number required (10 digits, optional +91, starts with 6-9)'),
  body('address').optional().trim().escape()
];

exports.loginValidation = [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];
