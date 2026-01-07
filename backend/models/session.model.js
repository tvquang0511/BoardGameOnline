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
};