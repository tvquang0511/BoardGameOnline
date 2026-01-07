const router = require('express').Router();
const leaderboard = require('../controllers/leaderboard.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', requireAuth, leaderboard.get);

module.exports = router;