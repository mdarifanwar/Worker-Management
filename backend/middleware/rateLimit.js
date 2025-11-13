const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per windowMs
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 register requests per windowMs
  message: {
    message: 'Too many registration attempts from this IP, please try again after 1 hour.'
  }
});
