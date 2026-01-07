const router = require('express').Router();
const ach = require('../controllers/achievements.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', ach.catalog);
router.get('/me', requireAuth, ach.my);

// bỏ unlock dev

module.exports = router;