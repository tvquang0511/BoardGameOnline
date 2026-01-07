exports.seed = async function (knex) {
  // Clear all tables and reset serials (Postgres)
  await knex.raw(`
    TRUNCATE TABLE
      audit_logs,
      game_results,
      user_achievements,
      achievements,
      messages,
      friends,
      saved_games,
      sessions,
      games,
      profiles,
      users
    RESTART IDENTITY CASCADE;
  `);

  // Users
  const insertedUsers = await knex('users')
    .insert([
      { email: 'admin@game.com', password_hash: null, role: 'admin' },
      { email: 'alice@example.com', password_hash: null, role: 'user' },
      { email: 'bob@example.com', password_hash: null, role: 'user' },
    ])
    .returning('*');

  const admin = insertedUsers.find(u => u.email === 'admin@game.com');
  const alice = insertedUsers.find(u => u.email === 'alice@example.com');
  const bob = insertedUsers.find(u => u.email === 'bob@example.com');

  // Profiles
  await knex('profiles')
    .insert([
      { user_id: admin.id, username: 'admin', display_name: 'Administrator' },
      { user_id: alice.id, username: 'alice', display_name: 'Alice' },
      { user_id: bob.id, username: 'bob', display_name: 'Bob' },
    ])
    .returning('*');

  // Games
  const insertedGames = await knex('games')
    .insert([
      { slug: 'tic-tac-toe', name: 'Tic Tac Toe', description: 'Classic 3x3', status: 'active', default_config: {} },
      { slug: 'sudoku', name: 'Sudoku', description: 'Number puzzles', status: 'active', default_config: {} },
    ])
    .returning('*');

  const tic = insertedGames.find(g => g.slug === 'tic-tac-toe');
  const sudoku = insertedGames.find(g => g.slug === 'sudoku');

  // Sessions
  const insertedSessions = await knex('sessions')
    .insert([
      { user_id: alice.id, game_id: tic.id, mode: 'casual', status: 'finished', score: 12, duration_seconds: 60, state: { board: [] } },
      { user_id: bob.id, game_id: tic.id, mode: 'casual', status: 'finished', score: 8, duration_seconds: 55, state: { board: [] } },
      { user_id: alice.id, game_id: sudoku.id, mode: 'ai', status: 'playing', score: 0, duration_seconds: 0, state: { progress: 'mid' } },
    ])
    .returning('*');

  const sessAliceTic = insertedSessions[0];
  const sessBobTic = insertedSessions[1];

  // Saved games
  await knex('saved_games')
    .insert([
      { user_id: alice.id, game_id: tic.id, session_id: sessAliceTic.id, name: 'Alice quick save', data: { note: 'checkpoint' } },
      { user_id: alice.id, game_id: sudoku.id, session_id: null, name: 'Sudoku slot 1', data: { board: [/*...*/] } },
    ])
    .returning('*');

  // Friends (accepted between Alice and Bob)
  await knex('friends')
    .insert([
      { requester_id: alice.id, addressee_id: bob.id, status: 'accepted' }
    ])
    .returning('*');

  // Messages between Alice and Bob
  await knex('messages')
    .insert([
      { sender_id: alice.id, receiver_id: bob.id, content: 'Hey Bob, wanna play?' },
      { sender_id: bob.id, receiver_id: alice.id, content: 'Sure! Give me 5 mins.' },
    ])
    .returning('*');

  // Achievements
  const insertedAchievements = await knex('achievements')
    .insert([
      { code: 'first_win', name: 'First Win', description: 'Win your first game', rarity: 'common', points: 10, criteria: {} },
      { code: 'high_score_100', name: 'Score 100', description: 'Reach 100 points in a game', rarity: 'rare', points: 50, criteria: {} },
    ])
    .returning('*');

  const achFirstWin = insertedAchievements.find(a => a.code === 'first_win');

  // User achievements (Alice unlocked first_win)
  await knex('user_achievements')
    .insert([
      { user_id: alice.id, achievement_id: achFirstWin.id, progress: 100, unlocked_at: knex.fn.now() }
    ])
    .returning('*');

  // Game results (leaderboard)
  await knex('game_results')
    .insert([
      { user_id: alice.id, game_id: tic.id, session_id: sessAliceTic.id, score: 12, duration_seconds: 60, result: 'win' },
      { user_id: bob.id, game_id: tic.id, session_id: sessBobTic.id, score: 8, duration_seconds: 55, result: 'lose' },
    ])
    .returning('*');

  // Audit log (seed record)
  await knex('audit_logs')
    .insert({
      actor_id: admin.id,
      action: 'seed:initial_data',
      target_type: null,
      target_id: null,
      data: { note: 'Initial demo data inserted' }
    });

  // Done
  return;
};