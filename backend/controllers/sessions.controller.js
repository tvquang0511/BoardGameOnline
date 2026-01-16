const Game = require("../models/game.model");
const Session = require("../models/session.model");
const Profile = require("../models/profile.model");
const db = require("../db/knex");
const AchievementService = require("../services/achievement.service");

exports.start = async (req, res, next) => {
  try {
    const { gameSlug, mode = "ai", state = {} } = req.body;
    const game = await Game.findBySlug(gameSlug);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const session = await Session.start({
      user_id: req.user.sub,
      game_id: game.id,
      mode,
      state,
    });
    res.status(201).json({ session, game });
  } catch (e) {
    next(e);
  }
};

exports.updateState = async (req, res, next) => {
  try {
    const { state, score, duration_seconds } = req.body;
    const session = await Session.updateState(req.params.id, req.user.sub, {
      state,
      score,
      duration_seconds,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ session });
  } catch (e) {
    next(e);
  }
};

exports.finish = async (req, res, next) => {
  try {
    const { result = "win", score = 0, duration_seconds = 0 } = req.body;

    // mark session finished (sets status, ended_at, score, duration_seconds)
    const session = await Session.finish(req.params.id, req.user.sub, {
      score,
      duration_seconds,
      status: "finished",
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // ensure game_results row is inserted for leaderboard / statistics
    await db("game_results").insert({
      user_id: req.user.sub,
      game_id: session.game_id,
      session_id: session.id,
      score,
      duration_seconds,
      result,
      created_at: db.fn.now(),
    });

    // Award points and update level
    const pointsResult = await Profile.addGamePoints(req.user.sub, {
      result,
      score,
      duration_seconds,
    });

    // Check and unlock achievements
    const unlockedAchievements = await AchievementService.checkAndUnlock(
      req.user.sub,
      {
        type: "game_finished",
        game_id: session.game_id,
        result,
        score,
        duration_seconds,
      }
    );

    res.json({
      session,
      achievements_unlocked: unlockedAchievements,
      points_earned: pointsResult?.earned_points || 0,
      level_up: pointsResult?.level_up || false,
      new_level: pointsResult?.new_level || 1,
    });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ message: "Session not found" });
    if (s.user_id !== req.user.sub && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    res.json({ session: s });
  } catch (e) {
    next(e);
  }
};

exports.sessionsByHour = async (req, res, next) => {
  try {
    // optionally allow custom hours via query (default 24)
    const hours = Math.max(1, parseInt(req.query.hours || "24", 10));
    const rows = await Session.sessionsByHour(hours);

    const map = new Map(rows.map((r) => [r.hour, r.count]));
    const result = [];
    for (let h = 0; h < 24; h++) {
      result.push({ hour: h, count: map.get(h) || 0 });
    }

    res.json({ hours: result });
  } catch (err) {
    next(err);
  }
};
