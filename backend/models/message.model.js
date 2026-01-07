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

  // list conversation partners (simple)
  async listConversations(me) {
    // get last message per partner (simple approach)
    const rows = await db(TABLE)
      .select('sender_id', 'receiver_id', 'content', 'created_at')
      .where(function () {
        this.where({ sender_id: me }).orWhere({ receiver_id: me });
      })
      .andWhere({ is_deleted: false })
      .orderBy('created_at', 'desc');

    // reduce on server side
    const map = new Map();
    for (const r of rows) {
      const partner = r.sender_id === me ? r.receiver_id : r.sender_id;
      if (!map.has(partner)) map.set(partner, r);
    }
    return Array.from(map.entries()).map(([partner_id, last]) => ({ partner_id, last }));
  },
};