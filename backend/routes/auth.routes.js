const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/login', auth.login);
router.post('/register', auth.register);

router.post('/logout', requireAuth, auth.logout);

router.get('/me', requireAuth, auth.me);

module.exports = router;