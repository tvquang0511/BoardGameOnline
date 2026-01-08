const db = require('../db/knex');
const TABLE = 'friends';

function canonicalPair(a, b) {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return { user_low_id: low, user_high_id: high };
}

module.exports = {
  canonicalPair,

  listAccepted(user_id) {
    return db(TABLE)
      .where({ status: 'accepted' })
      .andWhere(function () {
        this.where({ user_low_id: user_id }).orWhere({ user_high_id: user_id });
      })
      .orderBy('updated_at', 'desc');
  },

  listIncomingRequests(user_id) {
    return db(TABLE)
      .where({ addressee_id: user_id, status: 'pending' })
      .orderBy('created_at', 'desc');
  },

  listOutgoingRequests(user_id) {
    return db(TABLE)
      .where({ requester_id: user_id, status: 'pending' })
      .orderBy('created_at', 'desc');
  },

  async request(requester_id, addressee_id) {
    const pair = canonicalPair(requester_id, addressee_id);

    const [row] = await db(TABLE)
      .insert({
        requester_id,
        addressee_id,
        ...pair,
        status: 'pending',
      })
      .onConflict(['user_low_id', 'user_high_id'])
      .merge({
        requester_id,
        addressee_id,
        status: 'pending',
        updated_at: db.fn.now(),
      })
      .returning('*');

    return row;
  },

  findById(id) {
    return db(TABLE).where({ id }).first();
  },

  async updateStatus(id, user_id, status) {
    const [row] = await db(TABLE)
      .where({ id, addressee_id: user_id })
      .update({ status, updated_at: db.fn.now() })
      .returning('*');
    return row;
  },

  async cancel(id, user_id) {
    // requester can cancel pending
    const [row] = await db(TABLE)
      .where({ id, requester_id: user_id, status: 'pending' })
      .del()
      .returning('*');
    return row;
  },

  async unfriend(id, user_id) {
    // either side can delete accepted relation
    const rel = await db(TABLE).where({ id }).first();
    if (!rel) return null;
    if (rel.status !== 'accepted') return null;

    const ok = rel.user_low_id === user_id || rel.user_high_id === user_id;
    if (!ok) return null;

    const [row] = await db(TABLE).where({ id }).del().returning('*');
    return row;
  },
};