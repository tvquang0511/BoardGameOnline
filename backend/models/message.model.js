const db = require('../db/knex');
const TABLE = 'messages';

async function assertFriends(me, other) {
  const a = Number(me);
  const b = Number(other);
  const low = Math.min(a, b);
  const high = Math.max(a, b);

  const rel = await db('friends')
    .where({
      user_low_id: low,
      user_high_id: high,
      status: 'accepted',
    })
    .first();

  if (!rel) {
    const err = new Error('NOT_FRIENDS');
    err.status = 403;
    throw err;
  }
  return rel;
}

module.exports = {
  async send({ sender_id, receiver_id, content }) {
    await assertFriends(sender_id, receiver_id);
    const [row] = await db(TABLE).insert({ sender_id, receiver_id, content }).returning('*');
    return row;
  },

  async listWithUser({ me, withUser, page = 1, limit = 20 }) {
    const withUserId = Number(withUser);
    await assertFriends(me, withUserId);

    const offset = (page - 1) * limit;
    return db(TABLE)
      .where(function () {
        this.where({ sender_id: me, receiver_id: withUserId }).orWhere({ sender_id: withUserId, receiver_id: me });
      })
      .andWhere({ is_deleted: false })
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset);
  },

  async markRead(id, me) {
    const [row] = await db(TABLE)
      .where({ id, receiver_id: me })
      .update({ read_at: db.fn.now() })
      .returning('*');
    return row;
  },

  // NEW: Contacts = friends list (accepted) + last message + unread count
  async listContacts(me, { q = '', limit = 50 } = {}) {
    const qTrim = String(q || '').trim();
    const lim = Math.min(parseInt(limit || '50', 10) || 50, 200);

    // 1) lấy friend relations accepted
    const rels = await db('friends')
      .select('id', 'user_low_id', 'user_high_id', 'updated_at')
      .where({ status: 'accepted' })
      .andWhere(function () {
        this.where({ user_low_id: me }).orWhere({ user_high_id: me });
      })
      .orderBy('updated_at', 'desc');

    const friendIds = rels.map((r) => (r.user_low_id === me ? r.user_high_id : r.user_low_id));
    if (friendIds.length === 0) return [];

    // 2) join profiles/users cho friend info (có search)
    let friendsQuery = db('profiles')
      .join('users', 'users.id', 'profiles.user_id')
      .select(
        'users.id as user_id',
        'users.email',
        'users.created_at',
        'profiles.username',
        'profiles.display_name',
        'profiles.avatar_url',
        'profiles.level',
        'profiles.points'
      )
      .whereIn('users.id', friendIds)
      .andWhere('users.is_enabled', true)
      .limit(lim);

    if (qTrim) {
      friendsQuery = friendsQuery.andWhere(function () {
        this.where('profiles.username', 'ilike', `%${qTrim}%`)
          .orWhere('profiles.display_name', 'ilike', `%${qTrim}%`)
          .orWhere('users.email', 'ilike', `%${qTrim}%`);
      });
    }

    const friendInfos = await friendsQuery;
    const friendInfoMap = new Map(friendInfos.map((u) => [Number(u.user_id), u]));

    // filter rels theo search result
    const filteredFriendIds = new Set(friendInfos.map((u) => Number(u.user_id)));
    const filteredRels = rels.filter((r) => {
      const fid = r.user_low_id === me ? r.user_high_id : r.user_low_id;
      return filteredFriendIds.has(Number(fid));
    });

    const filteredIds = filteredRels.map((r) => (r.user_low_id === me ? r.user_high_id : r.user_low_id));
    if (filteredIds.length === 0) return [];

    // 3) unread counts theo friend (messages from friend to me, unread)
    const unreadRows = await db(TABLE)
      .select('sender_id as friend_id')
      .count('* as unread')
      .where({ receiver_id: me, is_deleted: false })
      .andWhere('read_at', null)
      .whereIn('sender_id', filteredIds)
      .groupBy('friend_id');

    const unreadMap = new Map();
    unreadRows.forEach((r) => unreadMap.set(Number(r.friend_id), parseInt(r.unread, 10)));

    // 4) last message per friend: query tất cả messages liên quan, sort desc và pick first per friend
    const lastRows = await db(TABLE)
      .select('id', 'sender_id', 'receiver_id', 'content', 'created_at')
      .where(function () {
        this.where({ sender_id: me }).whereIn('receiver_id', filteredIds);
      })
      .orWhere(function () {
        this.where({ receiver_id: me }).whereIn('sender_id', filteredIds);
      })
      .andWhere({ is_deleted: false })
      .orderBy('created_at', 'desc');

    const lastMap = new Map(); // friend_id -> lastMessageRow
    for (const r of lastRows) {
      const friendId = r.sender_id === me ? r.receiver_id : r.sender_id;
      if (!lastMap.has(Number(friendId))) lastMap.set(Number(friendId), r);
    }

    // 5) build output sorted: ưu tiên người có last message mới nhất, rồi fallback updated_at
    const contacts = filteredRels.map((rel) => {
      const friendId = rel.user_low_id === me ? rel.user_high_id : rel.user_low_id;
      const info = friendInfoMap.get(Number(friendId));
      const last = lastMap.get(Number(friendId)) || null;

      return {
        friend_id: Number(friendId),
        friendship_id: rel.id,
        friend: info
          ? {
              user_id: info.user_id,
              email: info.email,
              username: info.username,
              display_name: info.display_name,
              avatar_url:
                info.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(info.username || info.email || info.user_id)}`,
              level: info.level,
              points: info.points,
              created_at: info.created_at,
            }
          : null,
        last,
        unread: unreadMap.get(Number(friendId)) || 0,
        sort_time: last?.created_at || rel.updated_at,
      };
    });

    contacts.sort((a, b) => {
      const ta = new Date(a.sort_time).getTime();
      const tb = new Date(b.sort_time).getTime();
      return tb - ta;
    });

    return contacts;
  },
};