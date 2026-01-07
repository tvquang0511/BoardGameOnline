const Friend = require('../models/friend.model');
const User = require('../models/user.model');

exports.list = async (req, res, next) => {
  try {
    const rows = await Friend.listAccepted(req.user.sub);
    res.json({ friends: rows });
  } catch (e) { next(e); }
};

exports.requests = async (req, res, next) => {
  try {
    const rows = await Friend.listIncomingRequests(req.user.sub);
    res.json({ requests: rows });
  } catch (e) { next(e); }
};

exports.request = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const row = await Friend.request(req.user.sub, userId);
    res.status(201).json({ friend: row });
  } catch (e) { next(e); }
};

exports.accept = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(req.params.id, req.user.sub, 'accepted');
    if (!row) return res.status(404).json({ message: 'Request not found' });
    res.json({ friend: row });
  } catch (e) { next(e); }
};

exports.reject = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(req.params.id, req.user.sub, 'rejected');
    if (!row) return res.status(404).json({ message: 'Request not found' });
    res.json({ friend: row });
  } catch (e) { next(e); }
};