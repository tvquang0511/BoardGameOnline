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
  },

  async stats(user_id) {
    const totals = await db('game_results')
      .where({ user_id })
      .select(
        db.raw("count(*)::int as total_games"),
        db.raw("sum(case when result='win' then 1 else 0 end)::int as wins"),
        db.raw("sum(case when result='lose' then 1 else 0 end)::int as loses"),
        db.raw("sum(case when result='draw' then 1 else 0 end)::int as draws"),
        db.raw("coalesce(max(score), 0)::int as best_score")
      )
      .first();

    const winRate = totals.total_games ? +(totals.wins / totals.total_games * 100).toFixed(2) : 0;

    return {
      total_games: totals.total_games || 0,
      wins: totals.wins || 0,
      loses: totals.loses || 0,
      draws: totals.draws || 0,
      best_score: totals.best_score || 0,
      win_rate: winRate,
    };
  },
};