const db = require('../db/knex');

module.exports = {
  listCatalog() {
    return db('achievements').select('*').orderBy('created_at', 'asc');
  },

  async listForUser(user_id) {
    return db('user_achievements')
      .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
      .select(
        'achievements.code',
        'achievements.name',
        'achievements.description',
        'achievements.rarity',
        'achievements.points',
        'achievements.criteria',
        'user_achievements.progress',
        'user_achievements.unlocked_at'
      )
      .where('user_achievements.user_id', user_id)
      .orderBy('achievements.created_at', 'asc');
  },

  async unlockByCode(user_id, code) {
    const ach = await db('achievements').where({ code }).first();
    if (!ach) return null;

    const [row] = await db('user_achievements')
      .insert({ user_id, achievement_id: ach.id, progress: 100, unlocked_at: db.fn.now() })
      .onConflict(['user_id', 'achievement_id'])
      .merge({ progress: 100, unlocked_at: db.fn.now() })
      .returning('*');

    return { achievement: ach, user_achievement: row };
  },
};