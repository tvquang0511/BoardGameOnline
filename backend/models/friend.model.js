const db = require('../db/knex');
const TABLE = 'friends';

module.exports = {
  listAccepted(user_id) {
    // accepted where user is requester or addressee
    return db(TABLE)
      .where(function () {
        this.where({ requester_id: user_id }).orWhere({ addressee_id: user_id });
      })
      .andWhere({ status: 'accepted' })
      .orderBy('updated_at', 'desc');
  },
  listIncomingRequests(user_id) {
    return db(TABLE).where({ addressee_id: user_id, status: 'pending' }).orderBy('created_at', 'desc');
  },
  async request(requester_id, addressee_id) {
    const [row] = await db(TABLE)
      .insert({ requester_id, addressee_id, status: 'pending' })
      .onConflict(['requester_id', 'addressee_id'])
      .merge({ status: 'pending', updated_at: db.fn.now() })
      .returning('*');
    return row;
  },
  findById(id) {
    return db(TABLE).where({ id }).first();
  },
  async updateStatus(id, user_id, status) {
    // only addressee can accept/reject (simple)
    const [row] = await db(TABLE)
      .where({ id, addressee_id: user_id })
      .update({ status, updated_at: db.fn.now() })
      .returning('*');
    return row;
  },
};