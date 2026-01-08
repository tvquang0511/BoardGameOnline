const User = require('../models/user.model');
const db = require('../db/knex');

exports.users = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const users = await User.list({ q, page, limit });
    res.json({ users });
  } catch (e) { next(e); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { is_enabled, role } = req.body || {};
    const data = {};
    if (typeof is_enabled === 'boolean') data.is_enabled = is_enabled;
    if (role === 'user' || role === 'admin') data.role = role;

    const user = await User.update(req.params.id, data);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (e) { next(e); }
};

exports.stats = async (req, res, next) => {
  try {
    const [{ count: userCount }] = await db('users').count('*');
    const [{ count: gameSessionCount }] = await db('sessions').count('*');
    const [{ count: authSessionCount }] = await db('auth_sessions').count('*');

    const topGames = await db('game_results')
      .join('games', 'game_results.game_id', 'games.id')
      .select('games.slug', 'games.name')
      .count('* as plays')
      .groupBy('games.slug', 'games.name')
      .orderBy('plays', 'desc')
      .limit(5);

    res.json({
      users: Number(userCount),
      game_sessions: Number(gameSessionCount),
      auth_sessions: Number(authSessionCount),
      topGames,
    });
  } catch (e) { next(e); }
};