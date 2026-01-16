const db = require("../db/knex");
const { calculateLevel } = require("../utils/level");

/**
 * Achievement Service
 * Handles achievement checking, unlocking, and progress tracking
 */
class AchievementService {
  /**
   * Check and unlock achievements for a user based on an event
   * @param {number} user_id
   * @param {object} event - { type, ... }
   * @returns {Promise<Array>} List of newly unlocked achievements
   */
  async checkAndUnlock(user_id, event) {
    try {
      const achievements = await db("achievements").select("*");
      const unlocked = [];

      for (const ach of achievements) {
        // Skip if already unlocked
        const existing = await db("user_achievements")
          .where({
            user_id,
            achievement_id: ach.id,
          })
          .whereNotNull("unlocked_at")
          .first();

        if (existing?.unlocked_at) continue;

        const eligible = await this._checkEligibility(user_id, ach, event);
        if (eligible) {
          const result = await this._unlock(user_id, ach.id);
          if (result) {
            unlocked.push(ach);
            // Update profile points
            await this._awardPoints(user_id, ach.points);
          }
        } else {
          // Update progress even if not unlocked
          await this._updateProgress(user_id, ach);
        }
      }

      return unlocked;
    } catch (err) {
      console.error("Achievement check error:", err);
      return [];
    }
  }

  /**
   * Check if user is eligible for an achievement
   */
  async _checkEligibility(user_id, achievement, event) {
    const { type, target, game_slug } = achievement.criteria || {};

    switch (type) {
      case "win_count": {
        const query = db("game_results").where({ user_id, result: "win" });

        if (game_slug) {
          query
            .join("games", "game_results.game_id", "games.id")
            .where("games.slug", game_slug);
        }

        const { count } = await query.count("* as count").first();
        return Number(count) >= target;
      }

      case "win_streak": {
        const streak = await this._calculateWinStreak(user_id);
        return streak >= target;
      }

      case "level": {
        const profile = await db("profiles").where({ user_id }).first();
        return profile?.level >= target;
      }

      case "score_single": {
        const query = db("game_results").where({ user_id });

        if (game_slug) {
          query
            .join("games", "game_results.game_id", "games.id")
            .where("games.slug", game_slug);
        }

        const result = await query.max("score as max_score").first();
        return Number(result?.max_score || 0) >= target;
      }

      case "friends_count": {
        const { count } = await db("friends")
          .where({ status: "accepted" })
          .andWhere(function () {
            this.where({ user_low_id: user_id }).orWhere({
              user_high_id: user_id,
            });
          })
          .count("* as count")
          .first();
        return Number(count) >= target;
      }

      case "total_games": {
        const { count } = await db("game_results")
          .where({ user_id })
          .count("* as count")
          .first();
        return Number(count) >= target;
      }

      case "time_played": {
        const { total } = await db("game_results")
          .where({ user_id })
          .sum("duration_seconds as total")
          .first();
        return Number(total || 0) >= target;
      }

      default:
        return false;
    }
  }

  /**
   * Calculate win streak for a user
   */
  async _calculateWinStreak(user_id) {
    const results = await db("game_results")
      .where({ user_id })
      .orderBy("created_at", "desc")
      .select("result")
      .limit(100);

    let streak = 0;
    for (const r of results) {
      if (r.result === "win") {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Unlock achievement for user
   */
  async _unlock(user_id, achievement_id) {
    try {
      const [row] = await db("user_achievements")
        .insert({
          user_id,
          achievement_id,
          progress: 100,
          unlocked_at: db.fn.now(),
        })
        .onConflict(["user_id", "achievement_id"])
        .merge({
          progress: 100,
          unlocked_at: db.fn.now(),
        })
        .returning("*");

      return !!row;
    } catch {
      return false;
    }
  }

  /**
   * Update progress for achievement
   */
  async _updateProgress(user_id, achievement) {
    try {
      const progress = await this.calculateProgress(user_id, achievement);

      await db("user_achievements")
        .insert({
          user_id,
          achievement_id: achievement.id,
          progress: progress.progress,
          unlocked_at: null,
        })
        .onConflict(["user_id", "achievement_id"])
        .merge({
          progress: progress.progress,
        });
    } catch (err) {
      console.error("Progress update error:", err);
    }
  }

  /**
   * Award points to user profile from achievements
   */
  async _awardPoints(user_id, points) {
    // Validate points
    const validPoints = parseInt(points, 10);
    if (!validPoints || validPoints <= 0) return;

    try {
      const profile = await db("profiles").where({ user_id }).first();
      if (!profile) return;

      // Calculate new points and level
      const currentPoints = parseInt(profile.points, 10) || 0;
      const newPoints = currentPoints + validPoints;
      const newLevel = calculateLevel(newPoints);
      const oldLevel = profile.level || 1;

      // Update profile (level never decreases)
      await db("profiles")
        .where({ user_id })
        .update({
          points: newPoints,
          level: Math.max(oldLevel, newLevel),
          updated_at: db.fn.now(),
        });

      console.log(
        `[Achievement] User ${user_id}: +${validPoints} points (${currentPoints} → ${newPoints}), Level ${oldLevel} → ${newLevel}`
      );
    } catch (err) {
      console.error("Award points error:", err);
    }
  }

  /**
   * Calculate progress for achievement
   */
  async calculateProgress(user_id, achievement) {
    const { type, target, game_slug } = achievement.criteria || {};
    let current = 0;

    switch (type) {
      case "win_count": {
        const query = db("game_results").where({ user_id, result: "win" });
        if (game_slug) {
          query
            .join("games", "game_results.game_id", "games.id")
            .where("games.slug", game_slug);
        }
        const { count } = await query.count("* as count").first();
        current = Number(count);
        break;
      }

      case "win_streak": {
        current = await this._calculateWinStreak(user_id);
        break;
      }

      case "level": {
        const profile = await db("profiles").where({ user_id }).first();
        current = profile?.level || 1;
        break;
      }

      case "score_single": {
        const query = db("game_results").where({ user_id });
        if (game_slug) {
          query
            .join("games", "game_results.game_id", "games.id")
            .where("games.slug", game_slug);
        }
        const result = await query.max("score as max_score").first();
        current = Number(result?.max_score || 0);
        break;
      }

      case "friends_count": {
        const { count } = await db("friends")
          .where({ status: "accepted" })
          .andWhere(function () {
            this.where({ user_low_id: user_id }).orWhere({
              user_high_id: user_id,
            });
          })
          .count("* as count")
          .first();
        current = Number(count);
        break;
      }

      case "total_games": {
        const { count } = await db("game_results")
          .where({ user_id })
          .count("* as count")
          .first();
        current = Number(count);
        break;
      }

      case "time_played": {
        const { total } = await db("game_results")
          .where({ user_id })
          .sum("duration_seconds as total")
          .first();
        current = Number(total || 0);
        break;
      }

      default:
        break;
    }

    const progress =
      target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return {
      current,
      target: target || 0,
      progress,
    };
  }

  /**
   * Get all achievements with progress for a user
   */
  async getWithProgress(user_id) {
    const catalog = await db("achievements")
      .select("*")
      .orderBy("created_at", "asc");
    const unlocked = await db("user_achievements")
      .where({ user_id })
      .select("achievement_id", "progress", "unlocked_at");

    const unlockedMap = new Map(unlocked.map((u) => [u.achievement_id, u]));

    const results = await Promise.all(
      catalog.map(async (ach) => {
        const u = unlockedMap.get(ach.id);

        if (u?.unlocked_at) {
          return {
            ...ach,
            progress: 100,
            current: ach.criteria?.target || 0,
            target: ach.criteria?.target || 0,
            unlocked_at: u.unlocked_at,
          };
        }

        const prog = await this.calculateProgress(user_id, ach);
        return {
          ...ach,
          ...prog,
          unlocked_at: null,
        };
      })
    );

    return results;
  }

  /**
   * Recheck all achievements for a user (useful for retroactive unlocks)
   * @param {number} user_id
   * @returns {Promise<Array>} List of newly unlocked achievements
   */
  async recheckAll(user_id) {
    try {
      const achievements = await db("achievements").select("*");
      const unlocked = [];

      for (const ach of achievements) {
        // Skip if already unlocked
        const existing = await db("user_achievements")
          .where({ user_id, achievement_id: ach.id })
          .whereNotNull("unlocked_at")
          .first();

        if (existing?.unlocked_at) continue;

        // Check eligibility without event context
        const eligible = await this._checkEligibility(user_id, ach, {});
        if (eligible) {
          const result = await this._unlock(user_id, ach.id);
          if (result) {
            unlocked.push(ach);
            await this._awardPoints(user_id, ach.points);
          }
        } else {
          // Update progress
          await this._updateProgress(user_id, ach);
        }
      }

      return unlocked;
    } catch (err) {
      console.error("Achievement recheck error:", err);
      return [];
    }
  }
}

module.exports = new AchievementService();
