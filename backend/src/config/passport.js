const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function buildCallbackURL() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!redirectUri || redirectUri.includes('5173')) {
    return `${backendUrl}/api/auth/google/callback`;
  }

  return redirectUri;
}

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientID || !clientSecret) {
  console.warn(
    'Google OAuth env vars (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) not set. Google login is disabled.'
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: buildCallbackURL()
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          const googleId = profile.id;
          const name =
            profile.displayName ||
            (email ? email.split('@')[0] : 'User');

          if (!email) {
            return done(new Error('No email received from Google'), null);
          }

          let user = await User.findOne({ $or: [{ email }, { googleId }] });

          if (user) {
            if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
            }
          } else {
            user = await User.create({
              name,
              email,
              googleId,
              password: null
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;


