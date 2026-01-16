const db = require('../db/knex');
const TABLE = 'friends';

function canonicalPair(a, b) {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return { user_low_id: low, user_high_id: high };
}

function paginate({ page = 1, limit = 5 } = {}) {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 50);
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
}

module.exports = {
  canonicalPair,

  async findRelationship(user1_id, user2_id) {
    const pair = canonicalPair(user1_id, user2_id);
    return db(TABLE)
      .where({
        user_low_id: pair.user_low_id,
        user_high_id: pair.user_high_id,
      })
      .first();
  },

  async request(requester_id, addressee_id) {
    const pair = canonicalPair(requester_id, addressee_id);

    const existing = await db(TABLE)
      .where({
        user_low_id: pair.user_low_id,
        user_high_id: pair.user_high_id,
      })
      .first();

    if (existing) {
      if (existing.status === 'pending') {
        if (existing.requester_id === requester_id) {
          throw new Error('ALREADY_SENT_REQUEST');
        }
        if (existing.addressee_id === requester_id) {
          throw new Error('REQUEST_ALREADY_RECEIVED');
        }
      }

      if (existing.status === 'accepted') {
        throw new Error('ALREADY_FRIENDS');
      }

      if (existing.status === 'rejected') {
        const [row] = await db(TABLE)
          .where({ id: existing.id })
          .update({
            requester_id,
            addressee_id,
            status: 'pending',
            updated_at: db.fn.now(),
          })
          .returning('*');
        return row;
      }
    }

    const [row] = await db(TABLE)
      .insert({
        requester_id,
        addressee_id,
        ...pair,
        status: 'pending',
      })
      .returning('*');

    return row;
  },

  // ===== Pagination variants =====
  async listAcceptedPaginated(user_id, { page = 1, limit = 5 } = {}) {
    const { offset } = paginate({ page, limit });
    return db(TABLE)
      .where({ status: 'accepted' })
      .andWhere(function () {
        this.where({ user_low_id: user_id }).orWhere({ user_high_id: user_id });
      })
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset);
  },

  async countAccepted(user_id) {
    const row = await db(TABLE)
      .where({ status: 'accepted' })
      .andWhere(function () {
        this.where({ user_low_id: user_id }).orWhere({ user_high_id: user_id });
      })
      .count('* as c')
      .first();
    return Number(row?.c || 0);
  },

  async listIncomingRequestsPaginated(user_id, { page = 1, limit = 5 } = {}) {
    const { offset } = paginate({ page, limit });
    return db(TABLE)
      .where({ addressee_id: user_id, status: 'pending' })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  },

  async countIncomingRequests(user_id) {
    const row = await db(TABLE)
      .where({ addressee_id: user_id, status: 'pending' })
      .count('* as c')
      .first();
    return Number(row?.c || 0);
  },

  async listOutgoingRequestsPaginated(user_id, { page = 1, limit = 5 } = {}) {
    const { offset } = paginate({ page, limit });
    return db(TABLE)
      .where({ requester_id: user_id, status: 'pending' })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  },

  async countOutgoingRequests(user_id) {
    const row = await db(TABLE)
      .where({ requester_id: user_id, status: 'pending' })
      .count('* as c')
      .first();
    return Number(row?.c || 0);
  },

  // ===== Old methods kept if you still use them somewhere else =====
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
    const [row] = await db(TABLE)
      .where({ id, requester_id: user_id, status: 'pending' })
      .del()
      .returning('*');
    return row;
  },

  async unfriend(id, user_id) {
    const rel = await db(TABLE).where({ id }).first();
    if (!rel) return null;
    if (rel.status !== 'accepted') return null;

    const ok = rel.user_low_id === user_id || rel.user_high_id === user_id;
    if (!ok) return null;

    const [row] = await db(TABLE).where({ id }).del().returning('*');
    return row;
  },
};