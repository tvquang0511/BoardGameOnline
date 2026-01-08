const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user.model');
const Profile = require('../models/profile.model');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

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

    // Always create new users with role 'user'. Admin must be assigned explicitly in DB or via admin APIs.
    const user = await User.create({
      email,
      role: 'user',
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
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_enabled) {
      return res.status(403).json({ message: 'Account disabled' });
    }

    // No bypass allowed: always require password and validate it.
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password required' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Account has no password set' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    await User.update(user.id, { last_login_at: new Date() });

    const token = signToken(user);
    res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Stateless logout
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