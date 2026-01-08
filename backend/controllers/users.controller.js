const db = require('../db/knex');

exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);

    if (!q) return res.json({ users: [] });

    const users = await db('profiles')
      .join('users', 'profiles.user_id', 'users.id')
      .select(
        'users.id',
        'users.email',
        'users.role',
        'users.is_enabled',
        'profiles.username',
        'profiles.display_name',
        'profiles.avatar_url',
        'profiles.level',
        'profiles.points'
      )
      .where('users.is_enabled', true)
      .andWhere(function () {
        this.where('profiles.username', 'ilike', `%${q}%`)
          .orWhere('profiles.display_name', 'ilike', `%${q}%`)
          .orWhere('users.email', 'ilike', `%${q}%`);
      })
      .orderBy('profiles.points', 'desc')
      .limit(limit);

    res.json({ users });
  } catch (e) {
    next(e);
  }
};