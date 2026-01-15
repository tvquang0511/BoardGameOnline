const Message = require('../models/message.model');

exports.contacts = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = parseInt(req.query.limit || '50', 10);
    const contacts = await Message.listContacts(req.user.sub, { q, limit });
    res.json({ contacts });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const withUser = req.query.with;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);

    if (!withUser) return res.status(400).json({ message: 'with query param required' });

    const messages = await Message.listWithUser({ me: req.user.sub, withUser, page, limit });
    res.json({ messages });
  } catch (e) {
    if (e && e.message === 'NOT_FRIENDS') {
      return res.status(403).json({ message: 'Chỉ có thể nhắn tin với bạn bè' });
    }
    next(e);
  }
};

exports.send = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'receiverId and content required' });

    const msg = await Message.send({
      sender_id: req.user.sub,
      receiver_id: Number(receiverId),
      content: String(content),
    });

    res.status(201).json({ message: msg });
  } catch (e) {
    if (e && e.message === 'NOT_FRIENDS') {
      return res.status(403).json({ message: 'Chỉ có thể nhắn tin với bạn bè' });
    }
    next(e);
  }
};

exports.read = async (req, res, next) => {
  try {
    const msg = await Message.markRead(req.params.id, req.user.sub);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: msg });
  } catch (e) {
    next(e);
  }
};