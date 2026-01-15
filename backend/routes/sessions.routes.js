const router = require('express').Router();
const sessions = require('../controllers/sessions.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.post('/start', sessions.start);
router.get('/:id', sessions.getById);
router.patch('/:id/state', sessions.updateState);
router.post('/:id/finish', sessions.finish);

//Get sessions of games by hour
router.get('/statistics/sessions-by-hour', sessions.sessionsByHour);

module.exports = router;