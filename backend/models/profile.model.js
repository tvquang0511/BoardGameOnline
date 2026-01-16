const db = require("../db/knex");
const TABLE = "profiles";

module.exports = {
  findByUserId(user_id) {
    return db(TABLE).where({ user_id }).first();
  },

  async create({ user_id, username, display_name }) {
    const [p] = await db(TABLE)
      .insert({ user_id, username, display_name })
      .returning("*");
    return p;
  },

  async update(user_id, data) {
    const [p] = await db(TABLE)
      .where({ user_id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*");
    return p;
  },

  async stats(user_id) {
    const totals = await db("game_results")
      .where({ user_id })
      .select(
        db.raw("count(*)::int as total_games"),
        db.raw("sum(case when result='win' then 1 else 0 end)::int as wins"),
        db.raw("sum(case when result='lose' then 1 else 0 end)::int as loses"),
        db.raw("sum(case when result='draw' then 1 else 0 end)::int as draws"),
        db.raw("coalesce(max(score), 0)::int as best_score")
      )
      .first();

    const winRate = totals.total_games
      ? +((totals.wins / totals.total_games) * 100).toFixed(2)
      : 0;

    return {
      total_games: totals.total_games || 0,
      wins: totals.wins || 0,
      loses: totals.loses || 0,
      draws: totals.draws || 0,
      best_score: totals.best_score || 0,
      win_rate: winRate,
    };
  },

  async topAchievements(user_id, limit = 4) {
    // Lấy top achievements đã unlock theo điểm và độ hiếm
    const achievements = await db("user_achievements")
      .join(
        "achievements",
        "user_achievements.achievement_id",
        "achievements.id"
      )
      .where({ "user_achievements.user_id": user_id })
      .whereNotNull("user_achievements.unlocked_at")
      .select(
        "achievements.id",
        "achievements.code",
        "achievements.name",
        "achievements.description",
        "achievements.rarity",
        "achievements.points",
        "achievements.icon",
        "achievements.color",
        "user_achievements.unlocked_at"
      )
      .orderBy("achievements.points", "desc")
      .orderBy("user_achievements.unlocked_at", "desc")
      .limit(limit);

    return achievements;
  },

  async favoriteGames(user_id, limit = 4) {
    // Lấy top games chơi nhiều nhất với tỷ lệ thắng
    const games = await db("game_results")
      .join("games", "game_results.game_id", "games.id")
      .where({ "game_results.user_id": user_id })
      .groupBy("games.id", "games.name")
      .select(
        "games.id",
        "games.name",
        db.raw("count(*)::int as plays"),
        db.raw("sum(case when result='win' then 1 else 0 end)::int as wins"),
        db.raw(
          "round(avg(case when result='win' then 100 else 0 end))::int as win_rate"
        )
      )
      .orderBy("plays", "desc")
      .limit(limit);

    return games.map((g) => ({
      ...g,
      win_rate: `${g.win_rate}%`,
    }));
  },

  async addGamePoints(user_id, { result, score, duration_seconds }) {
    try {
      const profile = await db(TABLE).where({ user_id }).first();
      if (!profile) return null;

      // Points = total score from all games
      // Convert to number to avoid string concatenation
      const earnedPoints = parseInt(score, 10) || 0;

      // Update profile
      const currentPoints = parseInt(profile.points, 10) || 0;
      const newPoints = currentPoints + earnedPoints;
      const newLevel = Math.floor(1 + Math.sqrt(newPoints / 500)); // Level formula: √(points/500) + 1
      // Level progression: L2=500pts, L3=2000pts, L5=8000pts, L10=40500pts, L25=288000pts

      const [updated] = await db(TABLE)
        .where({ user_id })
        .update({
          points: newPoints,
          level: Math.max(profile.level || 1, newLevel),
          updated_at: db.fn.now(),
        })
        .returning("*");

      return {
        profile: updated,
        earned_points: earnedPoints,
        old_level: profile.level,
        new_level: updated.level,
        level_up: updated.level > profile.level,
      };
    } catch (err) {
      console.error("Add game points error:", err);
      return null;
    }
  },
};
