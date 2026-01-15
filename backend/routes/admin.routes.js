const router = require('express').Router();
const admin = require('../controllers/admin.controller');
const adminStats = require('../controllers/admin.statistics.controller');
const adminGames = require('../controllers/admin.game.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

router.use(requireAuth, requireAdmin);

// user management
router.get('/users', admin.users);
router.post('/users', admin.createUser);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

// existing stats endpoint (summary)
router.get('/stats', admin.stats);

// new detailed admin statistics endpoints
router.get('/statistics/dau', adminStats.dau);
router.get('/statistics/sessions-by-hour', adminStats.sessionsByHour);
router.get('/statistics/game-distribution', adminStats.gameDistribution);
router.get('/statistics/user-growth', adminStats.userGrowth);

//Game Administration
router.patch('/games/:id', adminGames.updateGame);



module.exports = router;