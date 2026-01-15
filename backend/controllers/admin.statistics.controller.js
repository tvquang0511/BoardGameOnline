const db = require('../db/knex');
const SessionStats = require('../models/admin.model');

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

    // Count auth_sessions by hour (started_at)
    const authRows = await db('auth_sessions')
      .where('started_at', '>=', from.toISOString())
      .select(db.raw("extract(hour from started_at) as hour"))
      .count('* as count')
      .groupBy('hour');

    // Count finished game sessions by hour (ended_at)
    const gameRows = await db('sessions')
      .whereNotNull('ended_at')
      .andWhere('ended_at', '>=', from.toISOString())
      .andWhere('status', 'finished')
      .select(db.raw("extract(hour from ended_at) as hour"))
      .count('* as count')
      .groupBy('hour');

    const map = new Map();
    authRows.forEach((r) => {
      const h = parseInt(r.hour, 10);
      map.set(h, (map.get(h) || 0) + parseInt(r.count, 10));
    });
    gameRows.forEach((r) => {
      const h = parseInt(r.hour, 10);
      map.set(h, (map.get(h) || 0) + parseInt(r.count, 10));
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
    const rows = await SessionStats.gameDistribution();

    // Backend returns rows with game_id, name, plays
    // Optionally compute percent if needed on frontend
    res.json({ distribution: rows });
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