const Achievement = require("../models/achievement.model");

exports.catalog = async (req, res, next) => {
  try {
    const achievements = await Achievement.listCatalog();
    res.json({ achievements });
  } catch (e) {
    next(e);
  }
};

exports.my = async (req, res, next) => {
  try {
    const achievements = await Achievement.listForUser(req.user.sub);
    res.json({ achievements });
  } catch (e) {
    next(e);
  }
};

exports.progress = async (req, res, next) => {
  try {
    const achievements = await Achievement.listForUserWithProgress(
      req.user.sub
    );
    res.json({ achievements });
  } catch (e) {
    next(e);
  }
};

// dev endpoint for testing
exports.unlock = async (req, res, next) => {
  try {
    const { code } = req.body;
    const data = await Achievement.unlockByCode(req.user.sub, code);
    if (!data)
      return res.status(404).json({ message: "Achievement not found" });
    res.json(data);
  } catch (e) {
    next(e);
  }
};
