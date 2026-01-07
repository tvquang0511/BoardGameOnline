const db = require('../db/knex');
const TABLE = 'saved_games';

module.exports = {
  listByUser({ user_id, game_id }) {
    let q = db(TABLE).where({ user_id }).orderBy('created_at', 'desc');
    if (game_id) q = q.andWhere({ game_id });
    return q;
  },
  async create({ user_id, game_id, session_id, name, data }) {
    const [row] = await db(TABLE).insert({ user_id, game_id, session_id, name, data }).returning('*');
    return row;
  },
  findById(id) {
    return db(TABLE).where({ id }).first();
  },
  async remove(id, user_id) {
    return db(TABLE).where({ id, user_id }).del();
  },
};