const router = require('express').Router();
const profiles = require('../controllers/profiles.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/me', profiles.me);
router.patch('/me', profiles.updateMe);

module.exports = router;