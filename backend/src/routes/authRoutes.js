const express = require('express');
const {
  register,
  login,
  logout,
  me,
  requestOtp,
  verifyOtp,
  googleAuth,
  googleCallback
} = require('../controllers/authController');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authRequired, me);

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;


