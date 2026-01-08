const router = require('express').Router();
const users = require('../controllers/users.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

// GET /api/users/search?q=
router.get('/search', users.search);

module.exports = router;