const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const https = require('https');
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
      return res.status(400).json({ message: 'This account uses OTP or Google login. Please use that method.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
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

async function verifyOtp(req, res) {
  try {
    const { email, otp, name } = req.body;
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

    user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: null
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

function googleAuth(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri || redirectUri.includes('5173')) {
    redirectUri = `${backendUrl}/api/auth/google/callback`;
  }
  if (!clientId) {
    return res.status(500).json({ message: 'Google OAuth not configured' });
  }
  const scope = encodeURIComponent('email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  res.redirect(url);
}

function googleCallback(req, res) {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri || redirectUri.includes('5173')) {
    redirectUri = `${backendUrl}/api/auth/google/callback`;
  }

  if (!code) {
    return res.redirect(`${frontendUrl}?auth_error=no_code`);
  }

  const postData = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }).toString();

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const tokenReq = https.request(options, (tokenRes) => {
    let data = '';
    tokenRes.on('data', (chunk) => { data += chunk; });
    tokenRes.on('end', async () => {
      try {
        const tokenJson = JSON.parse(data);
        const accessToken = tokenJson.access_token;
        if (!accessToken) {
          return res.redirect(`${frontendUrl}?auth_error=no_token`);
        }

        const userInfoReq = https.request(
          {
            hostname: 'www.googleapis.com',
            path: '/oauth2/v2/userinfo',
            headers: { Authorization: `Bearer ${accessToken}` }
          },
          (userRes) => {
            let userData = '';
            userRes.on('data', (chunk) => { userData += chunk; });
            userRes.on('end', async () => {
              try {
                const profile = JSON.parse(userData);
                const { email, name, id: googleId } = profile;
                if (!email) {
                  return res.redirect(`${frontendUrl}?auth_error=no_email`);
                }

                let user = await User.findOne({ $or: [{ email }, { googleId }] });
                if (user) {
                  if (!user.googleId) {
                    user.googleId = googleId;
                    await user.save();
                  }
                } else {
                  user = await User.create({
                    name: name || email.split('@')[0],
                    email,
                    googleId,
                    password: null
                  });
                }
                setTokenCookie(res, user._id);
                res.redirect(`${frontendUrl}?auth=success`);
              } catch (e) {
                console.error('Google userinfo error:', e.message);
                res.redirect(`${frontendUrl}?auth_error=parse_error`);
              }
            });
          }
        );
        userInfoReq.on('error', (e) => {
          console.error('Google userinfo request error:', e.message);
          res.redirect(`${frontendUrl}?auth_error=request_error`);
        });
        userInfoReq.end();
      } catch (e) {
        console.error('Google token parse error:', e.message);
        res.redirect(`${frontendUrl}?auth_error=token_error`);
      }
    });
  });
  tokenReq.on('error', (e) => {
    console.error('Google token request error:', e.message);
    res.redirect(`${frontendUrl}?auth_error=request_error`);
  });
  tokenReq.write(postData);
  tokenReq.end();
}

module.exports = {
  register,
  login,
  logout,
  me,
  requestOtp,
  verifyOtp,
  googleAuth,
  googleCallback
};


