const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/profiles', require('./profiles.routes')); // <-- add
router.use('/games', require('./games.routes'));
router.use('/sessions', require('./sessions.routes'));
router.use('/saved-games', require('./savedGames.routes'));
router.use('/friends', require('./friends.routes'));
router.use('/messages', require('./messages.routes'));
router.use('/achievements', require('./achievements.routes'));
router.use('/leaderboard', require('./leaderboard.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;