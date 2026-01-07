const Game = require('../models/game.model');

exports.list = async (req, res, next) => {
  try {
    const includeAll = req.query.all === 'true';
    const games = includeAll ? await Game.listAll() : await Game.listActive();
    res.json({ games });
  } catch (e) { next(e); }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const game = await Game.findBySlug(req.params.slug);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ game });
  } catch (e) { next(e); }
};

// admin
exports.create = async (req, res, next) => {
  try {
    const { slug, name, description, status, default_config } = req.body;
    const game = await Game.create({ slug, name, description, status, default_config });
    res.status(201).json({ game });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const game = await Game.update(req.params.id, req.body);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ game });
  } catch (e) { next(e); }
};