const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const AuthSession = require('../models/authSession.model');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const ADMIN_EMAIL = 'admin@game.com';

/**
 * Dev bypass only if DEV_ADMIN_BYPASS === 'true' AND NODE_ENV === 'development' and email matches.
 * By default bypass is disabled so admin still must provide correct password.
 */
function isDevAdminBypass(email) {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_ADMIN_BYPASS === 'true' &&
    email === ADMIN_EMAIL
  );
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, username, display_name } = req.body || {};

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existed = await User.findByEmail(email);
    if (existed) return res.status(409).json({ message: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
      password_hash,
    });

    await Profile.create({
      user_id: user.id,
      username: username || email.split('@')[0],
      display_name: display_name || username || email.split('@')[0],
    });

    const token = signToken(user);
    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.is_enabled) {
      return res.status(403).json({ message: 'Account disabled' });
    }

    // Only allow bypass when DEV_ADMIN_BYPASS=true in development; otherwise always check password.
    if (!isDevAdminBypass(email)) {
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Password required' });
      }
      if (!user.password_hash) {
        return res.status(401).json({ message: 'Account has no password set' });
      }
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    } else {
      // optional: log that a dev bypass was used (only in development)
      /* eslint-disable no-console */
      console.warn(`DEV_ADMIN_BYPASS used for ${email}`);
    }

    await User.update(user.id, { last_login_at: new Date() });

    // start auth session (model should exist)
    try {
      await AuthSession.start({
        user_id: user.id,
        ip: req.ip,
        user_agent: req.headers['user-agent'] || null,
      });
    } catch (e) {
      // non-fatal: don't block login if auth session recording fails
      console.warn('AuthSession.start failed', e?.message || e);
    }

    const token = signToken(user);
    res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // try to end latest auth session if model present
    try {
      await AuthSession.endLatest({ user_id: req.user.sub });
    } catch (e) {
      console.warn('AuthSession.endLatest failed', e?.message || e);
    }
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId);
    const profile = await Profile.findByUserId(userId);
    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
};