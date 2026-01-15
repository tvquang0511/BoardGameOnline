const bcrypt = require("bcryptjs");

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}
function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

exports.seed = async function (knex) {
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
      auth_sessions,
      profiles,
      users
    RESTART IDENTITY CASCADE;
  `);

  const password_hash = await bcrypt.hash("123456", 10);

  // Users
  const users = await knex("users")
    .insert([
      { email: "admin@game.com", role: "admin", password_hash },
      { email: "alice@example.com", role: "user", password_hash },
      { email: "bob@example.com", role: "user", password_hash },
      { email: "carol@example.com", role: "user", password_hash },
      { email: "dave@example.com", role: "user", password_hash },
      { email: "erin@example.com", role: "user", password_hash },
      { email: "frank@example.com", role: "user", password_hash },
      { email: "grace@example.com", role: "user", password_hash },
      { email: "heidi@example.com", role: "user", password_hash },
      { email: "ivan@example.com", role: "user", password_hash },
      { email: "judy@example.com", role: "user", password_hash },
    ])
    .returning("*");

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const admin = byEmail["admin@game.com"];
  const alice = byEmail["alice@example.com"];
  const bob = byEmail["bob@example.com"];
  const carol = byEmail["carol@example.com"];
  const dave = byEmail["dave@example.com"];
  const erin = byEmail["erin@example.com"];

  // Profiles
  await knex("profiles").insert([
    {
      user_id: admin.id,
      username: "admin",
      display_name: "Administrator",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      bio: "System admin",
      level: 99,
      points: 999999,
      settings: { darkMode: true },
    },
    {
      user_id: alice.id,
      username: "alice",
      display_name: "Alice",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      bio: "Love board games",
      level: 25,
      points: 12450,
      settings: { darkMode: false },
    },
    {
      user_id: bob.id,
      username: "bob",
      display_name: "Bob",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      bio: "Competitive gamer",
      level: 30,
      points: 16740,
      settings: { darkMode: true },
    },
    {
      user_id: carol.id,
      username: "carol",
      display_name: "Carol",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
      bio: "Casual player",
      level: 12,
      points: 3200,
      settings: {},
    },
    {
      user_id: dave.id,
      username: "dave",
      display_name: "Dave",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=dave",
      bio: "Puzzle lover",
      level: 18,
      points: 5200,
      settings: {},
    },
    {
      user_id: erin.id,
      username: "erin",
      display_name: "Erin",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=erin",
      bio: "Speed runner",
      level: 22,
      points: 8750,
      settings: {},
    },
  ]);

  // Games (match your frontend slugs more closely)
  const games = await knex("games")
    .insert([
      {
        slug: "caro5",
        name: "Cờ Caro 5",
        description: "Caro 5 hàng - bàn 15x15",
        status: "active",
        default_config: {
          board: { rows: 15, cols: 15 },
          time_limit_seconds: 1800,
          allow_save: true,
          allow_hint: true,
        },
      },
      {
        slug: "caro4",
        name: "Cờ Caro 4",
        description: "Caro 4 hàng - bàn 10x10",
        status: "active",
        default_config: {
          board: { rows: 10, cols: 10 },
          time_limit_seconds: 1200,
          allow_save: true,
          allow_hint: true,
        },
      },
      {
        slug: "tictactoe",
        name: "Tic-Tac-Toe",
        description: "Classic 3x3",
        status: "active",
        default_config: {
          board: { rows: 3, cols: 3 },
          time_limit_seconds: 300,
          allow_save: false,
          allow_hint: true,
        },
      },
      {
        slug: "snake",
        name: "Rắn săn mồi",
        description: "Snake game",
        status: "maintenance",
        default_config: {
          board: { rows: 20, cols: 20 },
          time_limit_seconds: 900,
          allow_save: false,
          allow_hint: false,
        },
      },
      {
        slug: "match3",
        name: "Ghép hàng 3",
        description: "Match-3 puzzle",
        status: "active",
        default_config: {
          board: { rows: 8, cols: 8 },
          time_limit_seconds: 600,
          allow_save: true,
          allow_hint: true,
        },
      },
      {
        slug: "candy",
        name: "Candy Rush",
        description: "Candy style match",
        status: "inactive",
        default_config: {
          board: { rows: 8, cols: 8 },
          time_limit_seconds: 600,
          allow_save: true,
          allow_hint: true,
        },
      },
      {
        slug: "sudoku",
        name: "Sudoku",
        description: "Number puzzle",
        status: "active",
        default_config: {
          difficulty: "medium",
          time_limit_seconds: 1800,
          allow_save: true,
          allow_hint: true,
        },
      },
    ])
    .returning("*");

  const gameBySlug = Object.fromEntries(games.map((g) => [g.slug, g]));

  // Auth sessions (login sessions)
  const authSessions = [];
  for (let d = 0; d < 10; d++) {
    for (const u of [alice, bob, carol, dave, erin]) {
      if (Math.random() > 0.35) {
        authSessions.push({
          user_id: u.id,
          started_at: daysAgo(d),
          ended_at: daysAgo(d),
          ip: "127.0.0.1",
          user_agent: "seed",
        });
      }
    }
  }
  await knex("auth_sessions").insert(authSessions);

  // Friends (canonical pair)
  function canonical(a, b) {
    return { low: Math.min(a, b), high: Math.max(a, b) };
  }

  const f1 = canonical(alice.id, bob.id);
  const f2 = canonical(alice.id, carol.id);
  const f3 = canonical(bob.id, dave.id);

  await knex("friends").insert([
    {
      requester_id: alice.id,
      addressee_id: bob.id,
      user_low_id: f1.low,
      user_high_id: f1.high,
      status: "accepted",
    },
    {
      requester_id: alice.id,
      addressee_id: carol.id,
      user_low_id: f2.low,
      user_high_id: f2.high,
      status: "pending",
    },
    {
      requester_id: bob.id,
      addressee_id: dave.id,
      user_low_id: f3.low,
      user_high_id: f3.high,
      status: "rejected",
    },
  ]);

  // Messages
  await knex("messages").insert([
    {
      sender_id: alice.id,
      receiver_id: bob.id,
      content: "Hey Bob, chơi caro không?",
      created_at: hoursAgo(6),
    },
    {
      sender_id: bob.id,
      receiver_id: alice.id,
      content: "Ok! chơi luôn",
      created_at: hoursAgo(5.8),
      read_at: hoursAgo(5.7),
    },
    {
      sender_id: alice.id,
      receiver_id: bob.id,
      content: "Tạo phòng nhé",
      created_at: hoursAgo(5.6),
    },

    {
      sender_id: alice.id,
      receiver_id: carol.id,
      content: "Kết bạn nha!",
      created_at: hoursAgo(2),
    },
    {
      sender_id: carol.id,
      receiver_id: alice.id,
      content: "Ok bạn",
      created_at: hoursAgo(1.5),
    },
  ]);

  // Achievements
  const achievements = await knex("achievements")
    .insert([
      {
        code: "first_win",
        name: "First Win",
        description: "Giành chiến thắng đầu tiên",
        rarity: "Common",
        points: 10,
        icon: "🎉",
        color: "from-green-400 to-emerald-500",
        category: "gameplay",
        criteria: { type: "win_count", target: 1 },
      },
      {
        code: "win_streak_5",
        name: "Win Streak 5",
        description: "Thắng 5 ván liên tiếp",
        rarity: "Rare",
        points: 30,
        icon: "🔥",
        color: "from-orange-400 to-red-500",
        category: "gameplay",
        criteria: { type: "win_streak", target: 5 },
      },
      {
        code: "level_25",
        name: "Master Player",
        description: "Đạt level 25",
        rarity: "Epic",
        points: 50,
        icon: "👑",
        color: "from-purple-400 to-pink-500",
        category: "level",
        criteria: { type: "level", target: 25 },
      },
      {
        code: "score_100",
        name: "Score Master",
        description: "Đạt điểm 100 trong 1 ván",
        rarity: "Rare",
        points: 25,
        icon: "💯",
        color: "from-blue-400 to-cyan-500",
        category: "gameplay",
        criteria: { type: "score_single", target: 100 },
      },
      {
        code: "social_10",
        name: "Social Butterfly",
        description: "Có 10 bạn bè",
        rarity: "Common",
        points: 20,
        icon: "🦋",
        color: "from-pink-400 to-rose-500",
        category: "social",
        criteria: { type: "friends_count", target: 10 },
      },
      {
        code: "total_games_50",
        name: "Dedicated Player",
        description: "Chơi 50 ván",
        rarity: "Common",
        points: 15,
        icon: "🎮",
        color: "from-indigo-400 to-blue-500",
        category: "gameplay",
        criteria: { type: "total_games", target: 50 },
      },
      {
        code: "caro_master",
        name: "Caro Master",
        description: "Thắng 10 ván Caro 5",
        rarity: "Rare",
        points: 35,
        icon: "⚫",
        color: "from-gray-600 to-gray-800",
        category: "gameplay",
        criteria: { type: "win_count", target: 10, game_slug: "caro5" },
      },
      {
        code: "time_played_10h",
        name: "Time Master",
        description: "Chơi tổng cộng 10 giờ",
        rarity: "Epic",
        points: 40,
        icon: "⏰",
        color: "from-yellow-500 to-amber-600",
        category: "gameplay",
        criteria: { type: "time_played", target: 36000 },
      },
      {
        code: "high_scorer",
        name: "High Scorer",
        description: "Đạt 500 điểm trong Snake",
        rarity: "Legendary",
        points: 100,
        icon: "🐍",
        color: "from-emerald-500 to-green-700",
        category: "gameplay",
        criteria: { type: "score_single", target: 500, game_slug: "snake" },
      },
      {
        code: "friend_maker",
        name: "Friend Maker",
        description: "Có 5 bạn bè",
        rarity: "Common",
        points: 10,
        icon: "👥",
        color: "from-teal-400 to-cyan-500",
        category: "social",
        criteria: { type: "friends_count", target: 5 },
      },
    ])
    .returning("*");

  const achByCode = Object.fromEntries(achievements.map((a) => [a.code, a]));

  // User achievements
  await knex("user_achievements").insert([
    {
      user_id: alice.id,
      achievement_id: achByCode.first_win.id,
      progress: 100,
      unlocked_at: daysAgo(20),
    },
    {
      user_id: alice.id,
      achievement_id: achByCode.level_25.id,
      progress: 100,
      unlocked_at: daysAgo(10),
    },
    {
      user_id: bob.id,
      achievement_id: achByCode.first_win.id,
      progress: 100,
      unlocked_at: daysAgo(15),
    },
    {
      user_id: bob.id,
      achievement_id: achByCode.score_100.id,
      progress: 60,
      unlocked_at: null,
    },
  ]);

  // Game sessions + results
  const sessions = await knex("sessions")
    .insert([
      {
        user_id: alice.id,
        game_id: gameBySlug.caro5.id,
        mode: "casual",
        status: "finished",
        score: 250,
        duration_seconds: 720,
        state: { board: [] },
        started_at: hoursAgo(20),
        ended_at: hoursAgo(19.8),
      },
      {
        user_id: alice.id,
        game_id: gameBySlug.tictactoe.id,
        mode: "casual",
        status: "finished",
        score: 100,
        duration_seconds: 300,
        state: { board: [] },
        started_at: hoursAgo(10),
        ended_at: hoursAgo(9.9),
      },
      {
        user_id: bob.id,
        game_id: gameBySlug.caro5.id,
        mode: "casual",
        status: "finished",
        score: 180,
        duration_seconds: 650,
        state: { board: [] },
        started_at: hoursAgo(22),
        ended_at: hoursAgo(21.8),
      },
      {
        user_id: erin.id,
        game_id: gameBySlug.match3.id,
        mode: "ai",
        status: "finished",
        score: 320,
        duration_seconds: 500,
        state: { grid: [] },
        started_at: hoursAgo(8),
        ended_at: hoursAgo(7.9),
      },
    ])
    .returning("*");

  await knex("game_results").insert([
    {
      user_id: alice.id,
      game_id: gameBySlug.caro5.id,
      session_id: sessions[0].id,
      score: 250,
      duration_seconds: 720,
      result: "win",
      created_at: hoursAgo(19.8),
    },
    {
      user_id: alice.id,
      game_id: gameBySlug.tictactoe.id,
      session_id: sessions[1].id,
      score: 100,
      duration_seconds: 300,
      result: "win",
      created_at: hoursAgo(9.9),
    },
    {
      user_id: bob.id,
      game_id: gameBySlug.caro5.id,
      session_id: sessions[2].id,
      score: 180,
      duration_seconds: 650,
      result: "lose",
      created_at: hoursAgo(21.8),
    },
    {
      user_id: erin.id,
      game_id: gameBySlug.match3.id,
      session_id: sessions[3].id,
      score: 320,
      duration_seconds: 500,
      result: "win",
      created_at: hoursAgo(7.9),
    },
  ]);

  // Saved games
  await knex("saved_games").insert([
    {
      user_id: alice.id,
      game_id: gameBySlug.sudoku.id,
      session_id: null,
      name: "Sudoku slot 1",
      data: { board: [], note: "checkpoint" },
      created_at: hoursAgo(30),
    },
  ]);

  // Audit log
  await knex("audit_logs").insert({
    actor_id: admin.id,
    action: "seed:full",
    data: { note: "Full demo data inserted" },
  });
};
