exports.up = async function (knex) {
  // Add new columns to achievements table
  await knex.schema.table("achievements", (t) => {
    t.string("icon").nullable().defaultTo("🏆");
    t.string("color").nullable().defaultTo("from-yellow-400 to-orange-500");
    t.string("category").nullable().defaultTo("gameplay"); // gameplay, social, level, collection
  });

  // Add index for performance
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked 
    ON user_achievements(user_id, unlocked_at);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_achievements_category 
    ON achievements(category);
  `);
};

exports.down = async function (knex) {
  await knex.schema.table("achievements", (t) => {
    t.dropColumn("icon");
    t.dropColumn("color");
    t.dropColumn("category");
  });

  await knex.raw(`DROP INDEX IF EXISTS idx_user_achievements_unlocked;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_achievements_category;`);
};
