const db = require('../db/knex');
const TABLE = 'games';

module.exports = {
  listActive() {
    return db(TABLE).whereIn('status', ['active', 'maintenance']).orderBy('name');
  },
  listAll() {
    return db(TABLE).select('*').orderBy('name');
  },
  findBySlug(slug) {
    return db(TABLE).where({ slug }).first();
  },
  findById(id) {
    return db(TABLE).where({ id }).first();
  },
  async create(data) {
    const [row] = await db(TABLE).insert(data).returning('*');
    return row;
  },
  async update(id, data) {
    const [row] = await db(TABLE).where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
    return row;
  },
};