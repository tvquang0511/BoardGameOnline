exports.up = async function (knex) {
  // game_reviews table
  await knex.schema.createTable("game_reviews", (t) => {
    t.increments("id").primary();
    t.integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.integer("game_id")
      .notNullable()
      .references("id")
      .inTable("games")
      .onDelete("CASCADE");
    t.integer("rating").notNullable().checkBetween([1, 5]); // 1-5 stars
    t.text("comment").nullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // One review per user per game
    t.unique(["user_id", "game_id"]);
    t.index(["game_id", "created_at"]);
    t.index(["user_id"]);
    t.index(["rating"]);
  });

  // Add average rating and review count to games table
  await knex.schema.table("games", (t) => {
    t.decimal("average_rating", 3, 2).nullable(); // e.g., 4.25
    t.integer("review_count").notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.table("games", (t) => {
    t.dropColumn("average_rating");
    t.dropColumn("review_count");
  });

  await knex.schema.dropTableIfExists("game_reviews");
};
