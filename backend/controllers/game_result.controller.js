const db = require("../db/knex");

/**
 * GET /api/me/game-results?limit=20&page=1
 * Trả về lịch sử game_results của người đang đăng nhập (mới nhất trước),
 * hỗ trợ pagination bằng limit & page (page bắt đầu từ 1).
 * Response: { results: [...], page, limit, hasMore }
 */
exports.myRecent = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const offset = (page - 1) * limit;

    // lấy limit + 1 để kiểm tra hasMore
    const rows = await db("game_results")
      .where("game_results.user_id", userId)
      .join("games", "games.id", "game_results.game_id")
      .select(
        "game_results.id",
        "game_results.game_id",
        "games.slug as game_slug",
        "games.name as game_name",
        "game_results.score",
        "game_results.duration_seconds",
        "game_results.result",
        "game_results.created_at"
      )
      .orderBy("game_results.created_at", "desc")
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop(); // bỏ bản ghi thứ limit+1

    res.json({ results: rows, page, limit, hasMore });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/me/most-played-game
 * Trả về trò chơi mà user hiện tại chơi nhiều nhất (theo số hàng trong game_results)
 * Response: { mostPlayed: { game_id, plays, game: { id, slug, name, ... } } } hoặc { mostPlayed: null }
 */
exports.myMostPlayed = async (req, res, next) => {
  try {
    const userId = req.user.sub;

    // tìm game_id có số lượt nhiều nhất
    const best = await db("game_results")
      .where("user_id", userId)
      .select("game_id")
      .count("* as plays")
      .groupBy("game_id")
      .orderBy("plays", "desc")
      .limit(1)
      .first();

    if (!best) return res.json({ mostPlayed: null });

    const game = await db("games").where("id", best.game_id).first();

    res.json({
      mostPlayed: {
        game_id: best.game_id,
        plays: Number(best.plays || 0),
        game: game || null,
      },
    });
  } catch (err) {
    next(err);
  }
};