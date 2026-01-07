const db = require('../db/knex');

module.exports = {
  async globalTop({ game_id, limit = 10 }) {
    return db('game_results')
      .join('profiles', 'game_results.user_id', 'profiles.user_id')
      .select('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .max('game_results.score as best_score')
      .where('game_results.game_id', game_id)
      .groupBy('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .orderBy('best_score', 'desc')
      .limit(limit);
  },

  async myBest({ user_id, game_id }) {
    const row = await db('game_results')
      .where({ user_id, game_id })
      .max('score as best_score')
      .first();
    return row;
  },

  async friendsTop({ user_id, friend_ids, game_id, limit = 10 }) {
    const ids = Array.from(new Set([user_id, ...friend_ids]));
    return db('game_results')
      .join('profiles', 'game_results.user_id', 'profiles.user_id')
      .select('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .max('game_results.score as best_score')
      .where('game_results.game_id', game_id)
      .whereIn('game_results.user_id', ids)
      .groupBy('game_results.user_id', 'profiles.username', 'profiles.display_name')
      .orderBy('best_score', 'desc')
      .limit(limit);
  },
};