const db = require('../db/knex');

exports.updateGame = async (req, res, next) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};

    // Only allow safe fields
    const allowed = {};
    if (payload.name) allowed.name = payload.name;
    if (payload.description) allowed.description = payload.description;
    if (payload.status) allowed.status = payload.status;
    if (typeof payload.default_config !== 'undefined') {
      // Ensure it's an object
      allowed.default_config = payload.default_config;
    }

    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ message: 'No updatable fields' });
    }

    const [game] = await db('games')
      .where({ id })
      .update({ ...allowed, updated_at: db.fn.now() })
      .returning('*');

    if (!game) return res.status(404).json({ message: 'Game not found' });

    res.json({ game });
  } catch (err) {
    next(err);
  }
};