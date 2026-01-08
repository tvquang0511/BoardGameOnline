const Game = require('../models/game.model');
const Leaderboard = require('../models/leaderboard.model');
const Friend = require('../models/friend.model');

function parseRange(query) {
  const { range, from, to } = query || {};
  if (from || to) return { from: from || null, to: to || null };

  const now = new Date();
  if (range === '7d') return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to: null };
  if (range === '30d') return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: null };
  return { from: null, to: null };
}

exports.get = async (req, res, next) => {
  try {
    const { gameSlug, scope = 'global', limit = 10 } = req.query;
    if (!gameSlug) return res.status(400).json({ message: 'gameSlug required' });

    const game = await Game.findBySlug(gameSlug);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    const lim = Math.min(parseInt(limit, 10) || 10, 100);
    const { from, to } = parseRange(req.query);

    if (scope === 'global') {
      const rows = await Leaderboard.globalTop({ game_id: game.id, limit: lim, from, to });
      return res.json({ game, scope, range: { from, to }, leaderboard: rows });
    }

    if (scope === 'me') {
      const best = await Leaderboard.myBest({ user_id: req.user.sub, game_id: game.id, from, to });
      return res.json({ game, scope, range: { from, to }, best });
    }

    if (scope === 'friends') {
      const relations = await Friend.listAccepted(req.user.sub);
      const friendIds = relations.map((r) => (r.user_low_id === req.user.sub ? r.user_high_id : r.user_low_id));
      const rows = await Leaderboard.friendsTop({ user_id: req.user.sub, friend_ids: friendIds, game_id: game.id, limit: lim, from, to });
      return res.json({ game, scope, range: { from, to }, leaderboard: rows });
    }

    return res.status(400).json({ message: 'Invalid scope' });
  } catch (e) {
    next(e);
  }
};