const User = require("../models/user.model");
const validator = require("validator");
const bcrypt = require("bcrypt");
const db = require("../db/knex");

exports.users = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const users = await User.list({ q, page, limit });

    // attach profiles if exists
    const ids = users.map((u) => u.id);
    let profiles = [];
    if (ids.length) {
      profiles = await db("profiles").whereIn("user_id", ids).select("*");
    }
    const profileByUserId = profiles.reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const result = users.map((u) => ({
      ...u,
      profile: profileByUserId[u.id] || null,
    }));
    res.json({ users: result });
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  const { email, password, display_name } = req.body || {};

  try {
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existed = await User.findByEmail(email);
    if (existed) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const created = await db.transaction(async (trx) => {
      const password_hash = await bcrypt.hash(password, 10);

      const [user] = await trx("users")
        .insert({ email, role: "user", password_hash })
        .returning("*");

      const username = email.split("@")[0];

      const [profile] = await trx("profiles")
        .insert({
          user_id: user.id,
          username,
          display_name: display_name || username,
        })
        .returning("*");

      return { user, profile };
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { email, password, display_name, is_enabled } = req.body || {};

  try {
    // Ensure user exists
    const existing = await User.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate email if provided and ensure uniqueness
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email" });
      }
      const byEmail = await User.findByEmail(email);
      if (byEmail && String(byEmail.id) !== String(id)) {
        return res
          .status(409)
          .json({ message: "Email already used by another account" });
      }
    }

    // Validate password if provided
    if (password && typeof password === "string" && password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Apply updates in a transaction (user + profile)
    const result = await db.transaction(async (trx) => {
      let updatedUser = existing;
      const userUpdates = {};

      if (typeof is_enabled !== "undefined") {
        userUpdates.is_enabled = !!is_enabled;
      }
      if (email) {
        userUpdates.email = email;
      }
      if (password) {
        userUpdates.password_hash = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdates).length) {
        const [u] = await trx("users")
          .where({ id })
          .update({ ...userUpdates, updated_at: db.fn.now() })
          .returning("*");
        updatedUser = u;
      } else {
        // reload to get freshest row
        updatedUser = await trx("users").where({ id }).first();
      }

      let profile = await trx("profiles").where({ user_id: id }).first();
      if (typeof display_name !== "undefined") {
        if (profile) {
          const [p] = await trx("profiles")
            .where({ user_id: id })
            .update({ display_name, updated_at: db.fn.now() })
            .returning("*");
          profile = p;
        } else {
          const username = (email && email.split("@")[0]) || `user_${id}`;
          const [p] = await trx("profiles")
            .insert({ user_id: id, username, display_name })
            .returning("*");
          profile = p;
        }
      }

      return { user: updatedUser, profile };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const id = req.params.id;

  try {
    const existing = await User.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.transaction(async (trx) => {
      // delete profile(s)
      await trx("profiles").where({ user_id: id }).del();
      // delete user
      await trx("users").where({ id }).del();
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [{ count: userCount }] = await db("users").count("*");
    const [{ count: gameSessionCount }] = await db("sessions").count("*");
    const [{ count: authSessionCount }] = await db("auth_sessions").count("*");

    const topGames = await db("game_results")
      .join("games", "game_results.game_id", "games.id")
      .select("games.slug", "games.name")
      .count("* as plays")
      .groupBy("games.slug", "games.name")
      .orderBy("plays", "desc")
      .limit(5);

    res.json({
      users: Number(userCount),
      game_sessions: Number(gameSessionCount),
      auth_sessions: Number(authSessionCount),
      topGames,
    });
  } catch (e) {
    next(e);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const {
      q: searchQuery = "",
      page = 1,
      limit = 50,
      type = "all", // "all", "auth", "game"
    } = req.query;
    const offset = (page - 1) * limit;
    let baseQuery = db
      .select(
        "a.id",
        "a.user_id",
        "a.started_at",
        "a.ended_at",
        "a.type",
        "a.game_id",
        "a.game_name",
        "a.mode",
        "a.status",
        "a.score",
        "a.duration_seconds",
        "a.ip",
        "a.user_agent",
        "a.state",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
      )
      .from(
        db
          .select(
            "id",
            "user_id",
            "started_at",
            "ended_at",
            db.raw("'auth' as type"),
            db.raw("null as game_id"),
            db.raw("null as game_name"),
            db.raw("null as mode"),
            db.raw("null as status"),
            db.raw("null as score"),
            db.raw("null as duration_seconds"),
            "ip",
            "user_agent",
            db.raw("null as state"),
          )
          .from("auth_sessions")
          .unionAll(
            db
              .select(
                "sessions.id",
                "sessions.user_id",
                "sessions.started_at",
                "sessions.ended_at",
                db.raw("'game' as type"),
                "sessions.game_id",
                "games.name as game_name",
                "sessions.mode",
                "sessions.status",
                "sessions.score",
                "sessions.duration_seconds",
                db.raw("null as ip"),
                db.raw("null as user_agent"),
                "sessions.state",
              )
              .from("sessions")
              .leftJoin("games", "sessions.game_id", "games.id"),
          )
          .as("a"),
      )
      .leftJoin("users", "a.user_id", "users.id")
      .leftJoin("profiles", "profiles.user_id", "users.id");
    if (searchQuery) {
      baseQuery.where(function () {
        this.where("users.email", "ilike", `%${searchQuery}%`).orWhere(
          "a.game_name",
          "ilike",
          `%${searchQuery}%`,
        );
      });
    }
    if (type !== "all") {
      baseQuery.where("a.type", type);
    }

    const countResult = await db
      .count("* as total")
      .from(baseQuery.clone().as("count_query"))
      .first();

    const total = Number(countResult.total);
    const activities = await baseQuery
      .orderBy("a.started_at", "desc")
      .limit(limit)
      .offset(offset);
    const enrichedActivities = activities.map((activity) => ({
      ...activity,
      user: activity.user_id
        ? {
            id: activity.user_id,
            email: activity.email,
            username: activity.username,
            display_name: activity.display_name,
            avatar_url: activity.avatar_url,
            level: activity.level,
          }
        : null,
      duration_formatted:
        activity.type === "game" && activity.duration_seconds
          ? formatDuration(activity.duration_seconds)
          : null,
    }));

    res.json({
      activities: enrichedActivities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

function formatDuration(seconds) {
  if (!seconds) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}
