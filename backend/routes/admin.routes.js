const router = require("express").Router();
const admin = require("../controllers/admin.controller");
const adminStats = require("../controllers/admin.statistics.controller");
const adminAch = require("../controllers/admin.achievements.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

router.use(requireAuth, requireAdmin);

// user management
router.get("/users", admin.users);
router.patch("/users/:id", admin.updateUser);

// existing stats endpoint (summary)
router.get("/stats", admin.stats);

// new detailed admin statistics endpoints
router.get("/statistics/dau", adminStats.dau);
router.get("/statistics/sessions-by-hour", adminStats.sessionsByHour);
router.get("/statistics/game-distribution", adminStats.gameDistribution);
router.get("/statistics/user-growth", adminStats.userGrowth);

// achievement management
router.get("/achievements", adminAch.list);
router.post("/achievements", adminAch.create);
router.patch("/achievements/:id", adminAch.update);
router.delete("/achievements/:id", adminAch.delete);
router.post("/achievements/:id/grant", adminAch.grantToUser);
router.get("/achievements/stats", adminAch.stats);

module.exports = router;
