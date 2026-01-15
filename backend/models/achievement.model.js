const db = require("../db/knex");
const AchievementService = require("../services/achievement.service");

module.exports = {
  listCatalog() {
    return db("achievements").select("*").orderBy("created_at", "asc");
  },

  async listForUser(user_id) {
    return db("user_achievements")
      .join(
        "achievements",
        "user_achievements.achievement_id",
        "achievements.id"
      )
      .select(
        "achievements.id",
        "achievements.code",
        "achievements.name",
        "achievements.description",
        "achievements.rarity",
        "achievements.points",
        "achievements.criteria",
        "achievements.icon",
        "achievements.color",
        "achievements.category",
        "user_achievements.progress",
        "user_achievements.unlocked_at"
      )
      .where("user_achievements.user_id", user_id)
      .orderBy("achievements.created_at", "asc");
  },

  async listForUserWithProgress(user_id) {
    return AchievementService.getWithProgress(user_id);
  },

  async unlockByCode(user_id, code) {
    const ach = await db("achievements").where({ code }).first();
    if (!ach) return null;

    const [row] = await db("user_achievements")
      .insert({
        user_id,
        achievement_id: ach.id,
        progress: 100,
        unlocked_at: db.fn.now(),
      })
      .onConflict(["user_id", "achievement_id"])
      .merge({ progress: 100, unlocked_at: db.fn.now() })
      .returning("*");

    return { achievement: ach, user_achievement: row };
  },

  async create(data) {
    const [ach] = await db("achievements").insert(data).returning("*");
    return ach;
  },

  async update(id, data) {
    const [ach] = await db("achievements")
      .where({ id })
      .update(data)
      .returning("*");
    return ach;
  },

  async delete(id) {
    return db("achievements").where({ id }).delete();
  },

  async findById(id) {
    return db("achievements").where({ id }).first();
  },
};
