const router = require("express").Router();
const games = require("../controllers/games.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

router.get("/", games.list);
router.get("/:slug", games.getBySlug);

// Reviews - public can view, auth required to create/update/delete
router.get("/:id/reviews", games.getReviews);
router.get("/:id/reviews/me", requireAuth, games.getMyReview);
router.post("/:id/reviews", requireAuth, games.createReview);
router.patch("/:id/reviews", requireAuth, games.updateReview);
router.delete("/:id/reviews", requireAuth, games.deleteReview);

// admin
router.post("/", requireAuth, requireAdmin, games.create);
router.patch("/:id", requireAuth, requireAdmin, games.update);

module.exports = router;
