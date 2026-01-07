const Game = require('../models/game.model');
const Session = require('../models/session.model');
const db = require('../db/knex');

exports.start = async (req, res, next) => {
  try {
    const { gameSlug, mode = 'ai', state = {} } = req.body;
    const game = await Game.findBySlug(gameSlug);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    const session = await Session.start({ user_id: req.user.sub, game_id: game.id, mode, state });
    res.status(201).json({ session, game });
  } catch (e) { next(e); }
};

exports.updateState = async (req, res, next) => {
  try {
    const { state, score, duration_seconds } = req.body;
    const session = await Session.updateState(req.params.id, req.user.sub, { state, score, duration_seconds });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (e) { next(e); }
};

exports.finish = async (req, res, next) => {
  try {
    const { result = 'win', score = 0, duration_seconds = 0 } = req.body;

    const session = await Session.finish(req.params.id, req.user.sub, { score, duration_seconds, status: 'finished' });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // write game_results for leaderboard
    await db('game_results').insert({
      user_id: req.user.sub,
      game_id: session.game_id,
      session_id: session.id,
      score,
      duration_seconds,
      result,
    });

    res.json({ session });
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Session not found' });
    if (s.user_id !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    res.json({ session: s });
  } catch (e) { next(e); }
};