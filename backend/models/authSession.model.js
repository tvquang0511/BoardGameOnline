const db = require('../db/knex');
const TABLE = 'auth_sessions';

module.exports = {
  async start({ user_id, ip = null, user_agent = null }) {
    const [row] = await db(TABLE)
      .insert({ user_id, ip, user_agent, started_at: db.fn.now() })
      .returning('*');
    return row;
  },

  async endLatest({ user_id }) {
    const [row] = await db(TABLE)
      .where({ user_id })
      .andWhere('ended_at', null)
      .orderBy('started_at', 'desc')
      .update({ ended_at: db.fn.now() })
      .returning('*');
    return row;
  },
};