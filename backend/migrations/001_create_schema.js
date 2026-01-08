exports.up = async function (knex) {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // users
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email').notNullable().unique();
    t.string('password_hash').nullable();
    t.enu('role', ['user', 'admin']).notNullable().defaultTo('user');
    t.boolean('is_enabled').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('last_login_at').nullable();
  });

  // profiles
  await knex.schema.createTable('profiles', (t) => {
    t.integer('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    t.string('username').notNullable().unique();
    t.string('display_name').nullable();
    t.string('avatar_url').nullable();
    t.text('bio').nullable();
    t.integer('level').notNullable().defaultTo(1);
    t.bigInteger('points').notNullable().defaultTo(0);
    t.jsonb('settings').notNullable().defaultTo('{}');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['username']);
  });

  // auth sessions (login sessions) for admin statistics
  await knex.schema.createTable('auth_sessions', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('ended_at').nullable();
    t.string('ip').nullable();
    t.text('user_agent').nullable();
    t.index(['user_id', 'started_at']);
    t.index(['started_at']);
  });

  // games
  await knex.schema.createTable('games', (t) => {
    t.increments('id').primary();
    t.string('slug').notNullable().unique();
    t.string('name').notNullable();
    t.text('description').nullable();
    t.enu('status', ['active', 'inactive', 'maintenance']).notNullable().defaultTo('active');
    t.jsonb('default_config').notNullable().defaultTo('{}'); // board/time/save/hint...
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['status']);
  });

  // sessions (game sessions)
  await knex.schema.createTable('sessions', (t) => {
    t.increments('id').primary();
    t.integer('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    t.enu('mode', ['ai', 'casual', 'ranked']).notNullable().defaultTo('ai');
    t.enu('status', ['playing', 'finished', 'abandoned']).notNullable().defaultTo('playing');

    t.integer('score').notNullable().defaultTo(0);
    t.integer('duration_seconds').notNullable().defaultTo(0);
    t.jsonb('state').notNullable().defaultTo('{}');

    t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('ended_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index(['user_id', 'game_id']);
    t.index(['game_id', 'status']);
    t.index(['started_at']);
  });

  // saved games
  await knex.schema.createTable('saved_games', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    t.integer('session_id').nullable().references('id').inTable('sessions').onDelete('SET NULL');
    t.string('name').nullable();
    t.jsonb('data').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'game_id']);
    t.index(['created_at']);
  });

  // friends - canonical pair to prevent reverse duplicates
  await knex.schema.createTable('friends', (t) => {
    t.increments('id').primary();
    t.integer('requester_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('addressee_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    t.integer('user_low_id').notNullable();
    t.integer('user_high_id').notNullable();

    t.enu('status', ['pending', 'accepted', 'rejected', 'blocked']).notNullable().defaultTo('pending');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.unique(['user_low_id', 'user_high_id']);
    t.index(['requester_id']);
    t.index(['addressee_id']);
    t.index(['user_low_id']);
    t.index(['user_high_id']);
    t.index(['status']);
  });

  // messages
  await knex.schema.createTable('messages', (t) => {
    t.increments('id').primary();
    t.integer('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('receiver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('content').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('read_at').nullable();
    t.boolean('is_deleted').notNullable().defaultTo(false);
    t.index(['sender_id', 'receiver_id']);
    t.index(['receiver_id', 'created_at']);
    t.index(['read_at']);
  });

  // achievements
  await knex.schema.createTable('achievements', (t) => {
    t.increments('id').primary();
    t.string('code').notNullable().unique();
    t.string('name').notNullable();
    t.text('description').nullable();
    t.string('rarity').nullable();
    t.integer('points').notNullable().defaultTo(0);
    // criteria suggestion: { type: "...", target: number, game_slug?: "...", ... }
    t.jsonb('criteria').notNullable().defaultTo('{}');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // user_achievements
  await knex.schema.createTable('user_achievements', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('achievement_id').notNullable().references('id').inTable('achievements').onDelete('CASCADE');
    t.integer('progress').notNullable().defaultTo(0);
    t.timestamp('unlocked_at').nullable();
    t.unique(['user_id', 'achievement_id']);
    t.index(['user_id']);
    t.index(['unlocked_at']);
  });

  // game results for leaderboard/history
  await knex.schema.createTable('game_results', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    t.integer('session_id').nullable().references('id').inTable('sessions').onDelete('SET NULL');
    t.integer('score').notNullable().defaultTo(0);
    t.integer('duration_seconds').notNullable().defaultTo(0);
    t.enu('result', ['win', 'lose', 'draw']).notNullable().defaultTo('win');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['game_id', 'score']);
    t.index(['user_id', 'game_id']);
    t.index(['created_at']);
  });

  // audit logs
  await knex.schema.createTable('audit_logs', (t) => {
    t.increments('id').primary();
    t.integer('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.string('action').notNullable();
    t.string('target_type').nullable();
    t.integer('target_id').nullable();
    t.jsonb('data').notNullable().defaultTo('{}');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['created_at']);
    t.index(['actor_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('game_results');
  await knex.schema.dropTableIfExists('user_achievements');
  await knex.schema.dropTableIfExists('achievements');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('friends');
  await knex.schema.dropTableIfExists('saved_games');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('games');
  await knex.schema.dropTableIfExists('auth_sessions');
  await knex.schema.dropTableIfExists('profiles');
  await knex.schema.dropTableIfExists('users');
};