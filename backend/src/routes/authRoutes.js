const express = require('express');
const passport = require('passport');
const {
  setTokenCookie,
  register,
  login,
  logout,
  me,
  requestOtp,
  verifyOtp,
  requestPasswordResetOtp,
  resetPasswordWithOtp
} = require('../controllers/authController');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authRequired, me);

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL ||
      process.env.FRONTEND_ORIGIN ||
      'http://localhost:5173'
    }?auth_error=google_failed`
  }),
  (req, res) => {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.FRONTEND_ORIGIN ||
      'http://localhost:5173';

    setTokenCookie(res, req.user._id);
    res.redirect(`${frontendUrl}?auth=success`);
  }
);

module.exports = router;
