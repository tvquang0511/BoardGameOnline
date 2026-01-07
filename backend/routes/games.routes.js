const router = require('express').Router();
const games = require('../controllers/games.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', games.list);
router.get('/:slug', games.getBySlug);

// admin
router.post('/', requireAuth, requireAdmin, games.create);
router.patch('/:id', requireAuth, requireAdmin, games.update);

module.exports = router;