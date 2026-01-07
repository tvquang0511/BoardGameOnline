const router = require('express').Router();
const saved = require('../controllers/savedGames.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/', saved.list);
router.post('/', saved.create);
router.get('/:id', saved.getById);
router.delete('/:id', saved.remove);

module.exports = router;