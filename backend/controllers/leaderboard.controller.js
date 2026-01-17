const Game = require("../models/game.model");
const Leaderboard = require("../models/leaderboard.model");
const Friend = require("../models/friend.model");

function parseRange(query) {
  const { range, from, to } = query || {};
  if (from || to) return { from: from || null, to: to || null };

  const now = new Date();
  if (range === "7d")
    return {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: null,
    };
  if (range === "30d")
    return {
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: null,
    };
  return { from: null, to: null };
}

/**
 * GET /api/leaderboard
 * Query params:
 * - gameSlug: game slug (optional) - if provided, ranks by total score in that game
 * - scope: 'global' | 'friends' | 'me' (default: 'global')
 * - page: page number (default: 1)
 * - limit: items per page (default: 10, max: 100)
 *
 * Without gameSlug: Ranking by profile points (overall)
 * With gameSlug: Ranking by total score in that specific game
 */
exports.get = async (req, res, next) => {
  try {
    const { gameSlug, scope = "global", page = 1, limit = 10 } = req.query;

    // Parse game (optional)
    let game = null;
    let game_id = null;
    if (gameSlug) {
      game = await Game.findBySlug(gameSlug);
      if (!game) return res.status(404).json({ message: "Game not found" });
      game_id = game.id;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100);

    // Global leaderboard with pagination
    if (scope === "global") {
      // If game specified, rank by total score in that game
      if (game_id) {
        const result = await Leaderboard.gameTop({
          game_id,
          page: pageNum,
          limit: lim,
        });
        return res.json({
          game,
          scope,
          leaderboard: result.rows,
          pagination: {
            page: result.page,
            limit: lim,
            total: result.total,
            totalPages: result.totalPages,
          },
        });
      }

      // Otherwise, rank by overall profile points
      const result = await Leaderboard.globalTop({
        page: pageNum,
        limit: lim,
      });
      return res.json({
        game: null,
        scope,
        leaderboard: result.rows,
        pagination: {
          page: result.page,
          limit: lim,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    }

    // Personal stats
    if (scope === "me") {
      // If game specified, get stats for that game
      if (game_id) {
        const stats = await Leaderboard.myGameBest({
          user_id: req.user.sub,
          game_id,
        });
        return res.json({
          game,
          scope,
          stats,
        });
      }

      // Otherwise, get overall stats
      const stats = await Leaderboard.myBest({
        user_id: req.user.sub,
      });
      return res.json({
        game: null,
        scope,
        stats,
      });
    }

    // Friends leaderboard with pagination
    if (scope === "friends") {
      const relations = await Friend.listAccepted(req.user.sub);
      const friendIds = relations.map((r) =>
        r.user_low_id === req.user.sub ? r.user_high_id : r.user_low_id
      );

      const result = await Leaderboard.friendsTop({
        user_id: req.user.sub,
        friend_ids: friendIds,
        game_id,
        page: pageNum,
        limit: lim,
      });

      return res.json({
        game,
        scope,
        leaderboard: result.rows,
        pagination: {
          page: result.page,
          limit: lim,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    }

    return res
      .status(400)
      .json({ message: "Invalid scope. Use: global, friends, me" });
  } catch (e) {
    next(e);
  }
};
