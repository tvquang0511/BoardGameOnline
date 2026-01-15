const db = require("../db/knex");

module.exports = {
  /**
   * Return distribution of finished sessions per game.
   * Returns array of rows: { game_id, name, plays }
   * Uses LEFT JOIN so games with zero plays are included.
   */
  async gameDistribution() {
    const rows = await db("games as g")
      .leftJoin("sessions as s", function () {
        this.on("s.game_id", "=", "g.id").andOn(
          "s.status",
          "=",
          db.raw("?", ["finished"])
        );
      })
      .select("g.id as game_id", "g.name")
      .count("s.id as plays")
      .groupBy("g.id", "g.name")
      .orderBy("plays", "desc");

    return rows.map((r) => ({
      game_id: r.game_id,
      name: r.name,
      plays: Number(r.plays),
    }));
  },
};
