const Achievement = require("../models/achievement.model");
const db = require("../db/knex");

exports.list = async (req, res, next) => {
  try {
    const achievements = await Achievement.listCatalog();

    // Add usage stats
    const achievementsWithStats = await Promise.all(
      achievements.map(async (ach) => {
        const { count } = await db("user_achievements")
          .where({ achievement_id: ach.id })
          .whereNotNull("unlocked_at")
          .count("* as count")
          .first();

        return {
          ...ach,
          unlocked_count: Number(count),
        };
      })
    );

    res.json({ achievements: achievementsWithStats });
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      rarity = "Common",
      points = 0,
      icon = "🏆",
      color = "from-yellow-400 to-orange-500",
      category = "gameplay",
      criteria = {},
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ message: "code and name are required" });
    }

    const achievement = await Achievement.create({
      code,
      name,
      description,
      rarity,
      points,
      icon,
      color,
      category,
      criteria,
    });

    res.status(201).json({ achievement });
  } catch (e) {
    if (e.code === "23505") {
      // Unique violation
      return res
        .status(409)
        .json({ message: "Achievement code already exists" });
    }
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      rarity,
      points,
      icon,
      color,
      category,
      criteria,
    } = req.body;

    const data = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (rarity !== undefined) data.rarity = rarity;
    if (points !== undefined) data.points = points;
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color;
    if (category !== undefined) data.category = category;
    if (criteria !== undefined) data.criteria = criteria;

    const achievement = await Achievement.update(id, data);
    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    res.json({ achievement });
  } catch (e) {
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "Achievement code already exists" });
    }
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    await Achievement.delete(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.grantToUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    const [row] = await db("user_achievements")
      .insert({
        user_id,
        achievement_id: id,
        progress: 100,
        unlocked_at: db.fn.now(),
      })
      .onConflict(["user_id", "achievement_id"])
      .merge({
        progress: 100,
        unlocked_at: db.fn.now(),
      })
      .returning("*");

    // Award points
    await db("profiles")
      .where({ user_id })
      .increment("points", achievement.points);

    res.json({ user_achievement: row });
  } catch (e) {
    next(e);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [totalAchievements] = await db("achievements").count("* as count");
    const [totalUnlocked] = await db("user_achievements")
      .whereNotNull("unlocked_at")
      .count("* as count");

    // Most unlocked achievements
    const mostUnlocked = await db("user_achievements")
      .join(
        "achievements",
        "user_achievements.achievement_id",
        "achievements.id"
      )
      .select("achievements.name", "achievements.code")
      .count("* as count")
      .whereNotNull("user_achievements.unlocked_at")
      .groupBy("achievements.id", "achievements.name", "achievements.code")
      .orderBy("count", "desc")
      .limit(5);

    // Least unlocked achievements
    const leastUnlocked = await db("achievements")
      .select("achievements.name", "achievements.code")
      .count("user_achievements.id as count")
      .leftJoin("user_achievements", function () {
        this.on(
          "achievements.id",
          "=",
          "user_achievements.achievement_id"
        ).andOnNotNull("user_achievements.unlocked_at");
      })
      .groupBy("achievements.id", "achievements.name", "achievements.code")
      .orderBy("count", "asc")
      .limit(5);

    res.json({
      total_achievements: Number(totalAchievements.count),
      total_unlocked: Number(totalUnlocked.count),
      most_unlocked: mostUnlocked.map((a) => ({
        ...a,
        count: Number(a.count),
      })),
      least_unlocked: leastUnlocked.map((a) => ({
        ...a,
        count: Number(a.count),
      })),
    });
  } catch (e) {
    next(e);
  }
};
