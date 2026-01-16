const db = require("./db/knex");

async function testMyStats() {
  try {
    // Test với user_id = 2 (alice)
    const user_id = 2;

    console.log("Testing myBest query for user_id:", user_id);

    const stats = await db("profiles")
      .leftJoin("game_results", "profiles.user_id", "game_results.user_id")
      .where("profiles.user_id", user_id)
      .select(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        db.raw("COUNT(game_results.id) as total_games"),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'win' THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'lose' THEN 1 ELSE 0 END) as loses"
        ),
        db.raw(
          "SUM(CASE WHEN game_results.result = 'draw' THEN 1 ELSE 0 END) as draws"
        )
      )
      .groupBy(
        "profiles.user_id",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points"
      )
      .first();

    console.log("Stats:", JSON.stringify(stats, null, 2));

    // Calculate rank
    const rankResult = await db("profiles")
      .where("points", ">", stats.points)
      .count("* as count")
      .first();

    console.log("Rank:", parseInt(rankResult?.count || 0) + 1);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testMyStats();
