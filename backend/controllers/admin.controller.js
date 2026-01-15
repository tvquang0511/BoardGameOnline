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
