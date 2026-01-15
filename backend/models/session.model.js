const db = require('../db/knex');
const TABLE = 'sessions';

module.exports = {
  findById(id) {
    return db(TABLE).where({ id }).first();
  },
  async start({ user_id, game_id, mode = 'ai', state = {} }) {
    const [row] = await db(TABLE).insert({
      user_id,
      game_id,
      mode,
      status: 'playing',
      state,
      started_at: db.fn.now(),
    }).returning('*');
    return row;
  },
  async updateState(id, user_id, { state, score, duration_seconds }) {
    const [row] = await db(TABLE)
      .where({ id, user_id })
      .update({
        state: state ?? db.raw('"state"'),
        score: score ?? db.raw('"score"'),
        duration_seconds: duration_seconds ?? db.raw('"duration_seconds"'),
        updated_at: db.fn.now(),
      })
      .returning('*');
    return row;
  },
  async finish(id, user_id, { score, duration_seconds, status = 'finished' }) {
    const [row] = await db(TABLE)
      .where({ id, user_id })
      .update({
        status,
        score: score ?? db.raw('"score"'),
        duration_seconds: duration_seconds ?? db.raw('"duration_seconds"'),
        ended_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');
    return row;
  },
  async sessionsByHour(hours = 24) {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const rows = await db('sessions')
      .whereNotNull('ended_at')
      .andWhere('ended_at', '>=', from.toISOString())
      .andWhere('status', 'finished')
      .select(db.raw("extract(hour from ended_at) as hour"))
      .count('* as count')
      .groupBy('hour')
      .orderBy('hour');

    return rows.map((r) => ({ hour: parseInt(r.hour, 10), count: parseInt(r.count, 10) }));
  },
};