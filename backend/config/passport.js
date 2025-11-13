
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Build callback URL from env when possible so it matches the actual server port/origin
const callbackURL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5002}/api/auth/google/callback`;

// Diagnostic info for local debugging
console.log(`[Passport] GOOGLE_CALLBACK_URL resolved to: ${callbackURL}`);
if (!clientID || !clientSecret) {
  console.warn('[Passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing — Google OAuth disabled');
} else {
  console.log('[Passport] Google OAuth credentials detected');
}

if (clientID && clientSecret) {
  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    // Extract user info from Google profile
    const email = profile.emails[0].value;
    const companyName = profile.displayName || '';
    const picture = profile.photos[0]?.value || '';
    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        companyName,
        email,
        password: accessToken, // random password
        logo: picture,
        phone: '',
        address: ''
      });
      await user.save();
    }
    return done(null, user);
  }));
} else {
  console.warn('Google OAuth disabled: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
