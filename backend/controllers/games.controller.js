const Game = require("../models/game.model");
const GameReview = require("../models/gameReview.model");

exports.list = async (req, res, next) => {
  try {
    const includeAll = req.query.all === "true";
    const games = includeAll ? await Game.listAll() : await Game.listActive();
    res.json({ games });
  } catch (e) {
    next(e);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const game = await Game.findBySlug(req.params.slug);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json({ game });
  } catch (e) {
    next(e);
  }
};

// admin
exports.create = async (req, res, next) => {
  try {
    const { slug, name, description, status, default_config } = req.body;
    const game = await Game.create({
      slug,
      name,
      description,
      status,
      default_config,
    });
    res.status(201).json({ game });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const game = await Game.update(req.params.id, req.body);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json({ game });
  } catch (e) {
    next(e);
  }
};

// Reviews
exports.getReviews = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const reviews = await GameReview.getByGameId(req.params.id, {
      limit,
      offset,
    });
    const stats = await GameReview.getStats(req.params.id);

    res.json({ reviews, stats });
  } catch (e) {
    next(e);
  }
};

exports.getMyReview = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const review = await GameReview.findByUserAndGame(
      req.user.sub,
      req.params.id,
    );
    res.json({ review: review || null });
  } catch (e) {
    next(e);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    // Check if user already reviewed this game
    const existing = await GameReview.findByUserAndGame(
      req.user.sub,
      req.params.id,
    );
    if (existing) {
      return res.status(400).json({
        message: "You have already reviewed this game. Use update instead.",
      });
    }

    const review = await GameReview.create({
      user_id: req.user.sub,
      game_id: req.params.id,
      rating: parseInt(rating, 10),
      comment: comment || null,
    });

    res.status(201).json({ review });
  } catch (e) {
    next(e);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const existing = await GameReview.findByUserAndGame(
      req.user.sub,
      req.params.id,
    );
    if (!existing) {
      return res.status(404).json({ message: "Review not found" });
    }

    const review = await GameReview.update(req.user.sub, req.params.id, {
      rating: rating !== undefined ? parseInt(rating, 10) : existing.rating,
      comment: comment !== undefined ? comment : existing.comment,
    });

    res.json({ review });
  } catch (e) {
    next(e);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const deleted = await GameReview.delete(req.user.sub, req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (e) {
    next(e);
  }
};
