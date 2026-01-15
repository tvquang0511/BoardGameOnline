const db = require('../db/knex');
const TABLE = 'friends';

function canonicalPair(a, b) {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return { user_low_id: low, user_high_id: high };
}

module.exports = {
  canonicalPair,

  // Tìm relationship giữa 2 users
  async findRelationship(user1_id, user2_id) {
    const pair = canonicalPair(user1_id, user2_id);
    return db(TABLE)
      .where({
        user_low_id: pair.user_low_id,
        user_high_id: pair.user_high_id,
      })
      .first();
  },

  // Gửi request với kiểm tra logic hợp lý
  async request(requester_id, addressee_id) {
    const pair = canonicalPair(requester_id, addressee_id);
    
    // Kiểm tra đã có relationship chưa
    const existing = await db(TABLE)
      .where({
        user_low_id: pair.user_low_id,
        user_high_id: pair.user_high_id,
      })
      .first();

    // Nếu đã có relationship
    if (existing) {
      // Nếu đang pending
      if (existing.status === 'pending') {
        // Nếu đã là người gửi trước đó
        if (existing.requester_id === requester_id) {
          throw new Error('ALREADY_SENT_REQUEST');
        }
        // Nếu người kia đã gửi cho mình
        if (existing.addressee_id === requester_id) {
          throw new Error('REQUEST_ALREADY_RECEIVED');
        }
      }
      
      // Nếu đã là bạn bè
      if (existing.status === 'accepted') {
        throw new Error('ALREADY_FRIENDS');
      }
      
      // Nếu đã bị từ chối, có thể gửi lại
      // Nhưng KHÔNG đảo ngược người gửi/người nhận!
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

    // Nếu chưa có relationship, tạo mới
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

  // Các hàm còn lại giữ nguyên...
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