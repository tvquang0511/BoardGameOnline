const db = require('../db/knex');
const TABLE = 'users';

module.exports = {
  findByEmail(email) {
    return db(TABLE).where({ email }).first();
  },
  
  findById(id) {
    return db(TABLE).where({ id }).first();
  },
  
  async create({ email, role = 'user', password_hash = null }) {
    const [u] = await db(TABLE).insert({ email, role, password_hash }).returning('*');
    return u;
  },
  
  async list({ q = '', page = 1, limit = 20 } = {}) {
    let query = db(TABLE).select('*');
    if (q) query = query.where('email', 'ilike', `%${q}%`);
    const offset = (page - 1) * limit;
    return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
  },
  
  async update(id, data) {
    const [u] = await db(TABLE).where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
    return u;
  },
  
  // Thêm hàm tìm kiếm với join profile
  async searchUsers(searchTerm, limit = 20) {
    return db(TABLE)
      .join('profiles', 'users.id', 'profiles.user_id')
      .select(
        'users.id',
        'users.email',
        'users.role',
        'users.is_enabled',
        'users.created_at',
        'profiles.username',
        'profiles.display_name',
        'profiles.avatar_url',
        'profiles.level',
        'profiles.points',
        'profiles.bio'
      )
      .where('users.is_enabled', true)
      .andWhere(function() {
        this.where('profiles.username', 'ilike', `%${searchTerm}%`)
          .orWhere('profiles.display_name', 'ilike', `%${searchTerm}%`)
          .orWhere('users.email', 'ilike', `%${searchTerm}%`);
      })
      .limit(limit)
      .orderBy('profiles.points', 'desc');
  }
};