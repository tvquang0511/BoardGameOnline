const router = require('express').Router();
const friends = require('../controllers/friends.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/', friends.list);
router.get('/requests', friends.requests);
router.post('/request', friends.request);
router.post('/:id/accept', friends.accept);
router.post('/:id/reject', friends.reject);

module.exports = router;