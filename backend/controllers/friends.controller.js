const Friend = require("../models/friend.model");
const User = require("../models/user.model");
const db = require("../db/knex");
const AchievementService = require("../services/achievement.service");

exports.list = async (req, res, next) => {
  try {
    const rows = await Friend.listAccepted(req.user.sub);
    res.json({ friends: rows });
  } catch (e) {
    next(e);
  }
};

exports.requests = async (req, res, next) => {
  try {
    const rows = await Friend.listIncomingRequests(req.user.sub);
    res.json({ requests: rows });
  } catch (e) {
    next(e);
  }
};

exports.outgoing = async (req, res, next) => {
  try {
    const rows = await Friend.listOutgoingRequests(req.user.sub);
    res.json({ requests: rows });
  } catch (e) {
    next(e);
  }
};

exports.request = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    if (Number(userId) === Number(req.user.sub)) {
      return res.status(400).json({ message: "Cannot friend yourself" });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const row = await Friend.request(req.user.sub, Number(userId));
    res.status(201).json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.accept = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(
      req.params.id,
      req.user.sub,
      "accepted"
    );
    if (!row) return res.status(404).json({ message: "Request not found" });

    // Check friend achievements
    const unlockedAchievements = await AchievementService.checkAndUnlock(
      req.user.sub,
      {
        type: "friend_accepted",
      }
    );

    res.json({ friend: row, achievements_unlocked: unlockedAchievements });
  } catch (e) {
    next(e);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(
      req.params.id,
      req.user.sub,
      "rejected"
    );
    if (!row) return res.status(404).json({ message: "Request not found" });
    res.json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const row = await Friend.cancel(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ message: "Request not found" });
    res.json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.unfriend = async (req, res, next) => {
  try {
    const row = await Friend.unfriend(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ message: "Friend not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

/**
 * Suggestions: users not yet friends/pending with me.
 * GET /api/friends/suggestions?q=&limit=
 */
exports.suggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "10", 10) || 10, 50);
    const me = req.user.sub;

    // existing relations ids
    const rels = await db("friends")
      .select("user_low_id", "user_high_id")
      .where(function () {
        this.where({ user_low_id: me }).orWhere({ user_high_id: me });
      });

    const excluded = new Set([me]);
    rels.forEach((r) => {
      excluded.add(r.user_low_id);
      excluded.add(r.user_high_id);
    });

    // base query on profiles (so we have username/display_name/avatar/level)
    let query = db("profiles")
      .join("users", "profiles.user_id", "users.id")
      .select(
        "users.id as user_id",
        "users.email",
        "users.role",
        "users.is_enabled",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .whereNotIn("users.id", Array.from(excluded))
      .andWhere("users.is_enabled", true)
      .orderBy("profiles.points", "desc")
      .limit(limit);

    if (q) {
      query = query.andWhere(function () {
        this.where("profiles.username", "ilike", `%${q}%`)
          .orWhere("profiles.display_name", "ilike", `%${q}%`)
          .orWhere("users.email", "ilike", `%${q}%`);
      });
    }

    const suggestions = await query;
    res.json({ suggestions });
  } catch (e) {
    next(e);
  }
};
