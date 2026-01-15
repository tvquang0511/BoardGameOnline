const User = require('../models/user.model');

exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);

    if (!q) return res.json({ users: [] });

    const users = await User.searchUsers(q, limit);
    
    // Format lại response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      level: user.level,
      points: user.points,
      bio: user.bio,
      role: user.role,
      is_enabled: user.is_enabled,
      created_at: user.created_at
    }));

    res.json({ users: formattedUsers });
  } catch (e) {
    next(e);
  }
};