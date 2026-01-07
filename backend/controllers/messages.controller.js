const Message = require('../models/message.model');

exports.conversations = async (req, res, next) => {
  try {
    const conversations = await Message.listConversations(req.user.sub);
    res.json({ conversations });
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const withUser = req.query.with;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);

    if (!withUser) return res.status(400).json({ message: 'with query param required' });

    const messages = await Message.listWithUser({ me: req.user.sub, withUser, page, limit });
    res.json({ messages });
  } catch (e) { next(e); }
};

exports.send = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'receiverId and content required' });

    const msg = await Message.send({ sender_id: req.user.sub, receiver_id: receiverId, content });
    res.status(201).json({ message: msg });
  } catch (e) { next(e); }
};

exports.read = async (req, res, next) => {
  try {
    const msg = await Message.markRead(req.params.id, req.user.sub);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: msg });
  } catch (e) { next(e); }
};