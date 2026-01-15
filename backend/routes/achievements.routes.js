const router = require("express").Router();
const ach = require("../controllers/achievements.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/", ach.catalog);
router.get("/me", requireAuth, ach.my);
router.get("/progress", requireAuth, ach.progress);

// Dev endpoint for testing
// router.post('/unlock', requireAuth, ach.unlock);

module.exports = router;
