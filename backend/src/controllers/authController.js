const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailService');

function setTokenCookie(res, userId) {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash
    });

    setTokenCookie(res, user._id);

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (!user.password) {
      return res.status(400).json({ message: 'Invalid Password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password.' });
    }

    setTokenCookie(res, user._id);

    res.json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

async function me(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp(req, res) {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emailLower = email.toLowerCase().trim();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email: emailLower });
    await Otp.create({ email: emailLower, otp, expiresAt });

    await sendOtpEmail(emailLower, otp);

    res.json({
      message: 'OTP sent to your email',
      email: emailLower,
      requiresName: !name
    });
  } catch (err) {
    console.error('Request OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
}

function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

async function verifyOtp(req, res) {
  try {
    const { email, otp, name, password } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const emailLower = email.toLowerCase().trim();

    const record = await Otp.findOne({ email: emailLower }).sort({ createdAt: -1 });
    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    await Otp.deleteOne({ _id: record._id });

    let user = await User.findOne({ email: emailLower });
    if (user) {
      setTokenCookie(res, user._id);
      return res.json({
        id: user._id,
        name: user.name,
        email: user.email
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required for new account' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required for new account' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hash
    });
    setTokenCookie(res, user._id);
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function requestPasswordResetOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email: emailLower });
    await Otp.create({ email: emailLower, otp, expiresAt });

    await sendOtpEmail(emailLower, otp);

    res.json({
      message: 'OTP sent to your email',
      email: emailLower
    });
  } catch (err) {
    console.error('Request password reset OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
}

async function resetPasswordWithOtp(req, res) {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ message: 'Email, OTP and new password are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      });
    }

    const emailLower = email.toLowerCase().trim();

    const record = await Otp.findOne({ email: emailLower }).sort({ createdAt: -1 });
    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    await Otp.deleteOne({ _id: record._id });

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    await user.save();

    res.json({ message: 'Password updated successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password with OTP error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  setTokenCookie,
  register,
  login,
  logout,
  me,
  requestOtp,
  verifyOtp,
  requestPasswordResetOtp,
  resetPasswordWithOtp
};
