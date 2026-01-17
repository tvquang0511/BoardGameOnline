const db = require("../db/knex");
const TABLE = "game_reviews";

module.exports = {
  // Get all reviews for a game
  async getByGameId(gameId, { limit = 50, offset = 0 } = {}) {
    return db(TABLE)
      .select(
        "game_reviews.*",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
      )
      .leftJoin("profiles", "game_reviews.user_id", "profiles.user_id")
      .where("game_reviews.game_id", gameId)
      .orderBy("game_reviews.created_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  // Get a user's review for a specific game
  findByUserAndGame(userId, gameId) {
    return db(TABLE)
      .select("*")
      .where("user_id", userId)
      .where("game_id", gameId)
      .first();
  },

  // Get all reviews by a user
  getByUserId(userId, { limit = 50, offset = 0 } = {}) {
    return db(TABLE)
      .select(
        "game_reviews.*",
        "games.name as game_name",
        "games.slug as game_slug",
      )
      .leftJoin("games", "game_reviews.game_id", "games.id")
      .where("game_reviews.user_id", userId)
      .orderBy("game_reviews.created_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  // Create a new review
  async create(data) {
    const [review] = await db(TABLE)
      .insert({
        user_id: data.user_id,
        game_id: data.game_id,
        rating: data.rating,
        comment: data.comment || null,
      })
      .returning("*");

    // Update game statistics
    await this.updateGameStats(data.game_id);

    return review;
  },

  // Update an existing review
  async update(userId, gameId, data) {
    const [review] = await db(TABLE)
      .where("user_id", userId)
      .where("game_id", gameId)
      .update({
        rating: data.rating,
        comment: data.comment || null,
        updated_at: db.fn.now(),
      })
      .returning("*");

    // Update game statistics
    await this.updateGameStats(gameId);

    return review;
  },

  // Delete a review
  async delete(userId, gameId) {
    const deleted = await db(TABLE)
      .where("user_id", userId)
      .where("game_id", gameId)
      .del();

    if (deleted > 0) {
      // Update game statistics
      await this.updateGameStats(gameId);
    }

    return deleted > 0;
  },

  // Update game average rating and review count
  async updateGameStats(gameId) {
    const stats = await db(TABLE)
      .where({ game_id: gameId })
      .select(
        db.raw("AVG(rating) as avg_rating"),
        db.raw("COUNT(*) as review_count"),
      )
      .first();

    await db("games")
      .where({ id: gameId })
      .update({
        average_rating:
          stats.review_count > 0
            ? parseFloat(stats.avg_rating).toFixed(2)
            : null,
        review_count: parseInt(stats.review_count, 10),
        updated_at: db.fn.now(),
      });
  },

  // Get review statistics for a game
  async getStats(gameId) {
    const ratingDistribution = await db(TABLE)
      .where({ game_id: gameId })
      .select("rating")
      .count("* as count")
      .groupBy("rating")
      .orderBy("rating", "desc");

    const stats = await db(TABLE)
      .where({ game_id: gameId })
      .select(
        db.raw("AVG(rating) as average_rating"),
        db.raw("COUNT(*) as total_reviews"),
      )
      .first();

    return {
      average_rating:
        stats.total_reviews > 0
          ? parseFloat(stats.average_rating).toFixed(2)
          : null,
      total_reviews: parseInt(stats.total_reviews, 10),
      rating_distribution: ratingDistribution.reduce((acc, item) => {
        acc[item.rating] = parseInt(item.count, 10);
        return acc;
      }, {}),
    };
  },
};
