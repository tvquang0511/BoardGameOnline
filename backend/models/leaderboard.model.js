const db = require("../db/knex");

module.exports = {
  /**
   * Get global leaderboard by total points with pagination
   * Ranks users by their profile points (not game scores)
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Promise<{rows: Array, total: number, page: number, totalPages: number}>}
   */
  async globalTop({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    // Get total count of users with game results
    const countQuery = db("profiles")
      .join("game_results", "profiles.user_id", "game_results.user_id")
      .countDistinct("profiles.user_id as count")
      .first();

    // Get ranked users by points
    const dataQuery = db("profiles")
      .join("game_results", "profiles.user_id", "game_results.user_id")
      .select(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        db.raw("COUNT(game_results.id) as total_games"),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
        )
      )
      .groupBy(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .orderBy("profiles.points", "desc")
      .limit(limit)
      .offset(offset);

    const [countResult, rows] = await Promise.all([countQuery, dataQuery]);

    const total = parseInt(countResult?.count || 0, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      rows: rows.map((r, idx) => ({
        user_id: r.user_id,
        rank: offset + idx + 1,
        username: r.username,
        display_name: r.display_name,
        avatar_url: r.avatar_url,
        level: r.level || 1,
        points: parseInt(r.points || 0, 10),
        total_games: parseInt(r.total_games || 0, 10),
        wins: parseInt(r.wins || 0, 10),
        loses: parseInt(r.loses || 0, 10),
        draws: parseInt(r.draws || 0, 10),
      })),
      total,
      page,
      totalPages,
    };
  },

  /**
   * Get game-specific leaderboard by total score in that game
   * Ranks users by their total score accumulated in a specific game
   * @param {number} game_id - Game ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Promise<{rows: Array, total: number, page: number, totalPages: number}>}
   */
  async gameTop({ game_id, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    // Get total count of users who played this game
    const countQuery = db("game_results")
      .join("profiles", "game_results.user_id", "profiles.user_id")
      .where("game_results.game_id", game_id)
      .countDistinct("game_results.user_id as count")
      .first();

    // Get ranked users by total score in this game
    const dataQuery = db("game_results")
      .join("profiles", "game_results.user_id", "profiles.user_id")
      .where("game_results.game_id", game_id)
      .select(
        "game_results.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        db.raw("SUM(game_results.score) as total_score"),
        db.raw("COUNT(game_results.id) as total_games"),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
        )
      )
      .groupBy(
        "game_results.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .orderBy("total_score", "desc")
      .limit(limit)
      .offset(offset);

    const [countResult, rows] = await Promise.all([countQuery, dataQuery]);

    const total = parseInt(countResult?.count || 0, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      rows: rows.map((r, idx) => ({
        user_id: r.user_id,
        rank: offset + idx + 1,
        username: r.username,
        display_name: r.display_name,
        avatar_url: r.avatar_url,
        level: r.level || 1,
        points: parseInt(r.points || 0, 10),
        total_score: parseInt(r.total_score || 0, 10),
        total_games: parseInt(r.total_games || 0, 10),
        wins: parseInt(r.wins || 0, 10),
        loses: parseInt(r.loses || 0, 10),
        draws: parseInt(r.draws || 0, 10),
      })),
      total,
      page,
      totalPages,
    };
  },

  /**
   * Get user's personal stats and ranking by points
   * @param {number} user_id - User ID
   * @returns {Promise<object>} User stats with rank
   */
  async myBest({ user_id }) {
    // Get user's profile and game stats
    const stats = await db("profiles")
      .leftJoin("game_results", "profiles.user_id", "game_results.user_id")
      .where("profiles.user_id", user_id)
      .select(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        db.raw("COUNT(game_results.id) as total_games"),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
        )
      )
      .groupBy(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .first();

    if (!stats) return null;

    // Calculate user's rank by counting users with more points (only those with game_results)
    const rankResult = await db("profiles")
      .join("game_results", "profiles.user_id", "game_results.user_id")
      .where("profiles.points", ">", stats.points)
      .countDistinct("profiles.user_id as count")
      .first();

    const rank = parseInt(rankResult?.count || 0, 10) + 1;

    return {
      user_id: stats.user_id,
      rank,
      username: stats.username,
      display_name: stats.display_name,
      avatar_url: stats.avatar_url,
      level: stats.level || 1,
      points: parseInt(stats.points || 0, 10),
      total_games: parseInt(stats.total_games || 0, 10),
      wins: parseInt(stats.wins || 0, 10),
      loses: parseInt(stats.loses || 0, 10),
      draws: parseInt(stats.draws || 0, 10),
    };
  },

  /**
   * Get friends leaderboard by points with pagination
   * @param {number} user_id - Current user ID
   * @param {Array<number>} friend_ids - Array of friend IDs
   * @param {number} game_id - Optional game ID for game-specific ranking
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Promise<{rows: Array, total: number, page: number, totalPages: number}>}
   */
  async friendsTop({
    user_id,
    friend_ids = [],
    game_id = null,
    page = 1,
    limit = 10,
  }) {
    const ids = Array.from(new Set([user_id, ...friend_ids]));
    const offset = (page - 1) * limit;

    if (ids.length === 0) {
      return { rows: [], total: 0, page, totalPages: 0 };
    }

    // If game_id provided, rank by total score in that game
    if (game_id) {
      // Get total count
      const countQuery = db("game_results")
        .join("profiles", "game_results.user_id", "profiles.user_id")
        .where("game_results.game_id", game_id)
        .whereIn("game_results.user_id", ids)
        .countDistinct("game_results.user_id as count")
        .first();

      // Get ranked friends by total score in this game
      const dataQuery = db("game_results")
        .join("profiles", "game_results.user_id", "profiles.user_id")
        .where("game_results.game_id", game_id)
        .whereIn("game_results.user_id", ids)
        .select(
          "game_results.user_id",
          "profiles.username",
          "profiles.display_name",
          "profiles.avatar_url",
          "profiles.level",
          "profiles.points",
          db.raw("SUM(game_results.score) as total_score"),
          db.raw("COUNT(game_results.id) as total_games"),
          db.raw(
            "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
          ),
          db.raw(
            "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
          ),
          db.raw(
            "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
          )
        )
        .groupBy(
          "game_results.user_id",
          "profiles.username",
          "profiles.display_name",
          "profiles.avatar_url",
          "profiles.level",
          "profiles.points"
        )
        .orderBy("total_score", "desc")
        .limit(limit)
        .offset(offset);

      const [countResult, rows] = await Promise.all([countQuery, dataQuery]);

      const total = parseInt(countResult?.count || 0, 10);
      const totalPages = Math.ceil(total / limit);

      return {
        rows: rows.map((r, idx) => ({
          user_id: r.user_id,
          rank: offset + idx + 1,
          is_current_user: r.user_id === user_id,
          username: r.username,
          display_name: r.display_name,
          avatar_url: r.avatar_url,
          level: r.level || 1,
          points: parseInt(r.points || 0, 10),
          total_score: parseInt(r.total_score || 0, 10),
          total_games: parseInt(r.total_games || 0, 10),
          wins: parseInt(r.wins || 0, 10),
          loses: parseInt(r.loses || 0, 10),
          draws: parseInt(r.draws || 0, 10),
        })),
        total,
        page,
        totalPages,
      };
    }

    // Otherwise, rank by overall profile points
    // Get total count
    const countQuery = db("profiles")
      .join("game_results", "profiles.user_id", "game_results.user_id")
      .whereIn("profiles.user_id", ids)
      .countDistinct("profiles.user_id as count")
      .first();

    // Get ranked friends by points
    const dataQuery = db("profiles")
      .join("game_results", "profiles.user_id", "game_results.user_id")
      .whereIn("profiles.user_id", ids)
      .select(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        db.raw("COUNT(game_results.id) as total_games"),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
        )
      )
      .groupBy(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .orderBy("profiles.points", "desc")
      .limit(limit)
      .offset(offset);

    const [countResult, rows] = await Promise.all([countQuery, dataQuery]);

    const total = parseInt(countResult?.count || 0, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      rows: rows.map((r, idx) => ({
        user_id: r.user_id,
        rank: offset + idx + 1,
        is_current_user: r.user_id === user_id,
        username: r.username,
        display_name: r.display_name,
        avatar_url: r.avatar_url,
        level: r.level || 1,
        points: parseInt(r.points || 0, 10),
        total_games: parseInt(r.total_games || 0, 10),
        wins: parseInt(r.wins || 0, 10),
        loses: parseInt(r.loses || 0, 10),
        draws: parseInt(r.draws || 0, 10),
      })),
      total,
      page,
      totalPages,
    };
  },

  /**
   * Get user's stats in a specific game
   * @param {number} user_id - User ID
   * @param {number} game_id - Game ID
   * @returns {Promise<object>} User stats with rank in that game
   */
  async myGameBest({ user_id, game_id }) {
    // Get user's stats in this game
    const stats = await db("game_results")
      .join("profiles", "game_results.user_id", "profiles.user_id")
      .where("game_results.user_id", user_id)
      .andWhere("game_results.game_id", game_id)
      .select(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        db.raw("SUM(game_results.score) as total_score"),
        db.raw("COUNT(game_results.id) as total_games"),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
        )
      )
      .groupBy(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .first();

    if (!stats) return null;

    // Calculate user's rank in this game by counting users with higher total score
    const rankResult = await db("game_results")
      .where("game_id", game_id)
      .groupBy("user_id")
      .select("user_id", db.raw("SUM(score) as total_score"))
      .havingRaw("SUM(score) > ?", [stats.total_score || 0]);

    const rank = rankResult.length + 1;

    return {
      user_id: stats.user_id,
      rank,
      username: stats.username,
      display_name: stats.display_name,
      avatar_url: stats.avatar_url,
      level: stats.level || 1,
      points: parseInt(stats.points || 0, 10),
      total_score: parseInt(stats.total_score || 0, 10),
      total_games: parseInt(stats.total_games || 0, 10),
      wins: parseInt(stats.wins || 0, 10),
      loses: parseInt(stats.loses || 0, 10),
      draws: parseInt(stats.draws || 0, 10),
    };
  },
};
