const router = require('express').Router();
const messages = require('../controllers/messages.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

// NEW: friends list for messenger left column
router.get('/contacts', messages.contacts);

router.get('/', messages.list);
router.post('/', messages.send);
router.post('/:id/read', messages.read);

module.exports = router;