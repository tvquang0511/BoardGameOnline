const Profile = require('../models/profile.model');

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
    const allowed = ['display_name', 'bio', 'avatar_url', 'settings', 'level', 'points'];
    const data = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) data[k] = req.body[k];
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