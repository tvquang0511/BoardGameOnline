const db = require('../db/knex');

/**
 * GET /api/admin/statistics/dau?days=7
 * DAU = unique users with auth_sessions started in day.
 */
exports.dau = async (req, res, next) => {
  try {
    const days = Math.max(1, parseInt(req.query.days, 10) || 7);

    const end = new Date();
    const start = new Date(end);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const rows = await db('auth_sessions')
      .where('started_at', '>=', start.toISOString())
      .select(db.raw("date_trunc('day', started_at) as day"))
      .countDistinct('user_id as users')
      .groupBy('day')
      .orderBy('day');

    const map = new Map();
    rows.forEach((r) => {
      const d = new Date(r.day);
      const key = d.toISOString().slice(0, 10);
      map.set(key, parseInt(r.users, 10));
    });

    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, users: map.get(key) || 0 });
    }

    res.json({ days: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/statistics/sessions-by-hour
 * Count auth sessions grouped by UTC hour for last 24h.
 */
exports.sessionsByHour = async (req, res, next) => {
  try {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const rows = await db('auth_sessions')
      .where('started_at', '>=', from.toISOString())
      .select(db.raw("extract(hour from started_at) as hour"))
      .count('* as count')
      .groupBy('hour')
      .orderBy('hour');

    const map = new Map();
    rows.forEach((r) => {
      const h = parseInt(r.hour, 10);
      map.set(h, parseInt(r.count, 10));
    });

    const result = [];
    for (let h = 0; h < 24; h++) {
      result.push({ hour: h, count: map.get(h) || 0 });
    }

    res.json({ hours: result });
  } catch (err) {
    next(err);
  }
};

exports.gameDistribution = async (req, res, next) => {
  try {
    const rows = await db('game_results')
      .join('games', 'game_results.game_id', 'games.id')
      .select('games.id as game_id', 'games.name')
      .count('* as plays')
      .groupBy('games.id', 'games.name')
      .orderBy('plays', 'desc');

    const total = rows.reduce((s, r) => s + parseInt(r.plays, 10), 0) || 0;

    const distribution = rows.map((r) => {
      const plays = parseInt(r.plays, 10);
      return {
        game_id: r.game_id,
        name: r.name,
        plays,
        percent: total ? +(plays / total * 100).toFixed(2) : 0,
      };
    });

    res.json({ total_plays: total, distribution });
  } catch (err) {
    next(err);
  }
};

exports.userGrowth = async (req, res, next) => {
  try {
    const months = Math.max(1, parseInt(req.query.months, 10) || 6);
    const now = new Date();
    const startMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0));
    const startISO = startMonth.toISOString();

    const rows = await db('users')
      .where('created_at', '>=', startISO)
      .select(db.raw("date_trunc('month', created_at) as month"))
      .count('* as new_users')
      .groupBy('month')
      .orderBy('month');

    const map = new Map();
    rows.forEach((r) => {
      const d = new Date(r.month);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      map.set(key, parseInt(r.new_users, 10));
    });

    const result = [];
    let cumulative = 0;

    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const new_users = map.get(key) || 0;
      cumulative += new_users;
      result.push({ month: key, new_users, cumulative });
    }

    res.json({ months: result });
  } catch (err) {
    next(err);
  }
};