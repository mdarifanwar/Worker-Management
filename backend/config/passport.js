
const passport = require('passport');
const User = require('../models/User');

// Only try to configure GoogleStrategy when credentials are provided.
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5002}/api/auth/google/callback`;

console.log(`[Passport] GOOGLE_CALLBACK_URL resolved to: ${callbackURL}`);
if (!clientID || !clientSecret) {
  console.warn('[Passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing — Google OAuth will remain disabled');
} else {
  try {
    // Require strategy lazily to avoid module errors when not using Google OAuth
    const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
    passport.use(new GoogleStrategy({
      clientID,
      clientSecret,
      callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const companyName = profile.displayName || '';
        const picture = profile.photos?.[0]?.value || '';
        if (!email) return done(new Error('Google profile contained no email'));
        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            companyName,
            email,
            password: accessToken,
            logo: picture,
            phone: '',
            address: ''
          });
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }));
    console.log('[Passport] Google OAuth configured');
  } catch (e) {
    console.warn('[Passport] passport-google-oauth20 not installed or failed to load — Google OAuth disabled');
  }
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
