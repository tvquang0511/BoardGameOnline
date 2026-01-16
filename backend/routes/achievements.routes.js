const router = require("express").Router();
const ach = require("../controllers/achievements.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/", ach.catalog);
router.get("/me", requireAuth, ach.my);
router.get("/progress", requireAuth, ach.progress);
router.post("/recheck", requireAuth, ach.recheck);

// Dev endpoint for testing
// router.post('/unlock', requireAuth, ach.unlock);

module.exports = router;
