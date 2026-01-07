const Game = require('../models/game.model');
const Saved = require('../models/savedGame.model');

exports.list = async (req, res, next) => {
  try {
    const { gameSlug } = req.query;
    let game_id = null;
    if (gameSlug) {
      const g = await Game.findBySlug(gameSlug);
      if (!g) return res.status(404).json({ message: 'Game not found' });
      game_id = g.id;
    }
    const saved = await Saved.listByUser({ user_id: req.user.sub, game_id });
    res.json({ saved });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { gameSlug, sessionId, name, data } = req.body;
    const g = await Game.findBySlug(gameSlug);
    if (!g) return res.status(404).json({ message: 'Game not found' });
    const saved = await Saved.create({
      user_id: req.user.sub,
      game_id: g.id,
      session_id: sessionId || null,
      name: name || null,
      data,
    });
    res.status(201).json({ saved });
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const s = await Saved.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Saved game not found' });
    if (s.user_id !== req.user.sub) return res.status(403).json({ message: 'Forbidden' });
    res.json({ saved: s });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Saved.remove(req.params.id, req.user.sub);
    if (!deleted) return res.status(404).json({ message: 'Saved game not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};