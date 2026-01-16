const router = require("express").Router();
const profiles = require("../controllers/profiles.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.use(requireAuth);

router.get("/me", profiles.me);
router.patch("/me", profiles.updateMe);
router.get("/me/stats", profiles.myStats);
router.get("/me/top-achievements", profiles.topAchievements);
router.get("/me/favorite-games", profiles.favoriteGames);

module.exports = router;
