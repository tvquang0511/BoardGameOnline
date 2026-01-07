const db = require('../db/knex');
const TABLE = 'profiles';

module.exports = {
  findByUserId(user_id) {
    return db(TABLE).where({ user_id }).first();
  },
  async create({ user_id, username, display_name }) {
    const [p] = await db(TABLE).insert({ user_id, username, display_name }).returning('*');
    return p;
  },
  async update(user_id, data) {
    const [p] = await db(TABLE).where({ user_id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
    return p;
  }
};