const Profile = require("../models/profile.model");

exports.me = async (req, res, next) => {
  try {
    const profile = await Profile.findByUserId(req.user.sub);
    res.json({ profile });
  } catch (e) {
    next(e);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = [
      "display_name",
      "bio",
      "avatar_url",
      "settings",
      "level",
      "points",
    ];
    const data = {};

    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        // Validate và sanitize data
        if (k === "display_name" && req.body[k]) {
          data[k] = req.body[k].trim().substring(0, 50);
        } else if (k === "bio" && req.body[k]) {
          data[k] = req.body[k].trim().substring(0, 500);
        } else if (k === "avatar_url" && req.body[k]) {
          // Validate avatar URL (chỉ cho phép Dicebear URLs hoặc để trống)
          const url = req.body[k].trim();
          if (url.startsWith("https://api.dicebear.com/") || url === "") {
            data[k] = url;
          } else {
            return res.status(400).json({ error: "Avatar URL không hợp lệ" });
          }
        } else {
          data[k] = req.body[k];
        }
      }
    }

    const profile = await Profile.update(req.user.sub, data);
    res.json({ profile });
  } catch (e) {
    next(e);
  }
};

exports.myStats = async (req, res, next) => {
  try {
    const stats = await Profile.stats(req.user.sub);
    res.json({ stats });
  } catch (e) {
    next(e);
  }
};

exports.topAchievements = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const achievements = await Profile.topAchievements(req.user.sub, limit);
    res.json({ achievements });
  } catch (e) {
    next(e);
  }
};

exports.favoriteGames = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const games = await Profile.favoriteGames(req.user.sub, limit);
    res.json({ games });
  } catch (e) {
    next(e);
  }
};

exports.myGlobalRank = async (req, res, next) => {
  try {
    const rank = await Profile.getGlobalRank(req.user.sub);
    res.json({ rank });
  } catch (e) {
    next(e);
  }
};
