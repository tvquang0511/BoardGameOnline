const router = require('express').Router();
const messages = require('../controllers/messages.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/conversations', messages.conversations);
router.get('/', messages.list);
router.post('/', messages.send);
router.post('/:id/read', messages.read);

module.exports = router;