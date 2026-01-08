const router = require('express').Router();
const friends = require('../controllers/friends.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/', friends.list);
router.get('/requests', friends.requests);
router.get('/outgoing', friends.outgoing);

router.get('/suggestions', friends.suggestions);

router.post('/request', friends.request);
router.post('/:id/accept', friends.accept);
router.post('/:id/reject', friends.reject);
router.delete('/:id/cancel', friends.cancel);
router.delete('/:id/unfriend', friends.unfriend);

module.exports = router;