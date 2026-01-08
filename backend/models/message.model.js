const db = require('../db/knex');
const TABLE = 'messages';

module.exports = {
  async send({ sender_id, receiver_id, content }) {
    const [row] = await db(TABLE).insert({ sender_id, receiver_id, content }).returning('*');
    return row;
  },

  listWithUser({ me, withUser, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    return db(TABLE)
      .where(function () {
        this.where({ sender_id: me, receiver_id: withUser }).orWhere({ sender_id: withUser, receiver_id: me });
      })
      .andWhere({ is_deleted: false })
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset);
  },

  async markRead(id, me) {
    const [row] = await db(TABLE).where({ id, receiver_id: me }).update({ read_at: db.fn.now() }).returning('*');
    return row;
  },

  async listConversations(me) {
    const rows = await db(TABLE)
      .select('sender_id', 'receiver_id', 'content', 'created_at')
      .where(function () {
        this.where({ sender_id: me }).orWhere({ receiver_id: me });
      })
      .andWhere({ is_deleted: false })
      .orderBy('created_at', 'desc');

    const map = new Map();
    for (const r of rows) {
      const partner = r.sender_id === me ? r.receiver_id : r.sender_id;
      if (!map.has(partner)) map.set(partner, r);
    }
    const partners = Array.from(map.keys());

    // unread counts for each partner
    const unreadRows = await db(TABLE)
      .select('sender_id as partner_id')
      .count('* as unread')
      .where({ receiver_id: me, is_deleted: false })
      .andWhere('read_at', null)
      .whereIn('sender_id', partners)
      .groupBy('partner_id');

    const unreadMap = new Map();
    unreadRows.forEach((r) => unreadMap.set(Number(r.partner_id), parseInt(r.unread, 10)));

    return Array.from(map.entries()).map(([partner_id, last]) => ({
      partner_id,
      last,
      unread: unreadMap.get(Number(partner_id)) || 0,
    }));
  },
};