const Game = require('../models/game.model');
const Leaderboard = require('../models/leaderboard.model');
const Friend = require('../models/friend.model');

exports.get = async (req, res, next) => {
  try {
    const { gameSlug, scope = 'global', limit = 10 } = req.query;
    if (!gameSlug) return res.status(400).json({ message: 'gameSlug required' });

    const game = await Game.findBySlug(gameSlug);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    const lim = Math.min(parseInt(limit, 10) || 10, 100);

    if (scope === 'global') {
      const rows = await Leaderboard.globalTop({ game_id: game.id, limit: lim });
      return res.json({ game, scope, leaderboard: rows });
    }

    if (scope === 'me') {
      const best = await Leaderboard.myBest({ user_id: req.user.sub, game_id: game.id });
      return res.json({ game, scope, best });
    }

    if (scope === 'friends') {
      const relations = await Friend.listAccepted(req.user.sub);
      const friendIds = relations.map(r => (r.requester_id === req.user.sub ? r.addressee_id : r.requester_id));
      const rows = await Leaderboard.friendsTop({ user_id: req.user.sub, friend_ids: friendIds, game_id: game.id, limit: lim });
      return res.json({ game, scope, leaderboard: rows });
    }

    return res.status(400).json({ message: 'Invalid scope' });
  } catch (e) { next(e); }
};