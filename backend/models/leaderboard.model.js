const db = require('../db/knex');

module.exports = {
  async globalTop({ game_id, limit = 10, from = null, to = null }) {
    let q = db('game_results')
      .join('profiles', 'game_results.user_id', 'profiles.user_id')
      .select('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .max('game_results.score as best_score')
      .where('game_results.game_id', game_id);

    if (from) q = q.andWhere('game_results.created_at', '>=', from);
    if (to) q = q.andWhere('game_results.created_at', '<=', to);

    return q
      .groupBy('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .orderBy('best_score', 'desc')
      .limit(limit);
  },

  async myBest({ user_id, game_id, from = null, to = null }) {
    let q = db('game_results')
      .where({ user_id, game_id })
      .max('score as best_score');

    if (from) q = q.andWhere('created_at', '>=', from);
    if (to) q = q.andWhere('created_at', '<=', to);

    return q.first();
  },

  async friendsTop({ user_id, friend_ids, game_id, limit = 10, from = null, to = null }) {
    const ids = Array.from(new Set([user_id, ...friend_ids]));

    let q = db('game_results')
      .join('profiles', 'game_results.user_id', 'profiles.user_id')
      .select('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .max('game_results.score as best_score')
      .where('game_results.game_id', game_id)
      .whereIn('game_results.user_id', ids);

    if (from) q = q.andWhere('game_results.created_at', '>=', from);
    if (to) q = q.andWhere('game_results.created_at', '<=', to);

    return q
      .groupBy('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .orderBy('best_score', 'desc')
      .limit(limit);
  },
};