const Friend = require("../models/friend.model");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const db = require("../db/knex");
const AchievementService = require("../services/achievement.service");

async function getFriendProfile(userId) {
  const profile = await Profile.findByUserId(userId);
  const user = await User.findById(userId);

  if (!profile || !user) return null;

  return {
    id: userId,
    email: user.email,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url:
      profile.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
    level: profile.level,
    points: profile.points,
    bio: profile.bio,
    created_at: user.created_at,
  };
}

function parsePaging(req, defaults = { page: 1, limit: 5 }) {
  const page = Math.max(parseInt(req.query.page || defaults.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || defaults.limit, 10) || defaults.limit, 1),
    50
  );
  return { page, limit };
}

function metaFromTotal({ page, limit, total }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { page, limit, total, totalPages };
}

exports.list = async (req, res, next) => {
  try {
    const { page, limit } = parsePaging(req, { page: 1, limit: 5 });

    const [total, rows] = await Promise.all([
      Friend.countAccepted(req.user.sub),
      Friend.listAcceptedPaginated(req.user.sub, { page, limit }),
    ]);

    const friends = await Promise.all(
      rows.map(async (rel) => {
        const friendId =
          rel.user_low_id === req.user.sub ? rel.user_high_id : rel.user_low_id;

        const friendProfile = await getFriendProfile(friendId);
        if (!friendProfile) return null;

        return {
          friendship_id: rel.id,
          user_id: friendProfile.id,
          ...friendProfile,
          status: "accepted",
          created_at: rel.created_at,
          updated_at: rel.updated_at,
        };
      })
    );

    res.json({
      friends: friends.filter(Boolean),
      meta: metaFromTotal({ page, limit, total }),
    });
  } catch (e) {
    next(e);
  }
};

exports.requests = async (req, res, next) => {
  try {
    const { page, limit } = parsePaging(req, { page: 1, limit: 5 });

    const [total, rows] = await Promise.all([
      Friend.countIncomingRequests(req.user.sub),
      Friend.listIncomingRequestsPaginated(req.user.sub, { page, limit }),
    ]);

    const requests = await Promise.all(
      rows.map(async (rel) => {
        const requesterProfile = await getFriendProfile(rel.requester_id);
        if (!requesterProfile) return null;

        return {
          friendship_id: rel.id,
          requester_id: rel.requester_id,
          user_id: requesterProfile.id,
          ...requesterProfile,
          status: rel.status,
          created_at: rel.created_at,
          updated_at: rel.updated_at,
        };
      })
    );

    res.json({
      requests: requests.filter(Boolean),
      meta: metaFromTotal({ page, limit, total }),
    });
  } catch (e) {
    next(e);
  }
};

exports.outgoing = async (req, res, next) => {
  try {
    const { page, limit } = parsePaging(req, { page: 1, limit: 5 });

    const [total, rows] = await Promise.all([
      Friend.countOutgoingRequests(req.user.sub),
      Friend.listOutgoingRequestsPaginated(req.user.sub, { page, limit }),
    ]);

    const requests = await Promise.all(
      rows.map(async (rel) => {
        const addresseeProfile = await getFriendProfile(rel.addressee_id);
        if (!addresseeProfile) return null;

        return {
          friendship_id: rel.id,
          addressee_id: rel.addressee_id,
          user_id: addresseeProfile.id,
          ...addresseeProfile,
          status: rel.status,
          created_at: rel.created_at,
          updated_at: rel.updated_at,
        };
      })
    );

    res.json({
      requests: requests.filter(Boolean),
      meta: metaFromTotal({ page, limit, total }),
    });
  } catch (e) {
    next(e);
  }
};

exports.request = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    if (Number(userId) === Number(req.user.sub)) {
      return res
        .status(400)
        .json({ message: "Không thể kết bạn với chính mình" });
    }

    const target = await User.findById(userId);
    if (!target)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    try {
      const row = await Friend.request(req.user.sub, Number(userId));
      res.status(201).json({ friend: row });
    } catch (error) {
      switch (error.message) {
        case "ALREADY_SENT_REQUEST":
          return res
            .status(400)
            .json({ message: "Bạn đã gửi lời mời kết bạn cho người này rồi" });
        case "REQUEST_ALREADY_RECEIVED":
          return res.status(400).json({
            message:
              'Người này đã gửi lời mời cho bạn. Vui lòng kiểm tra mục "Lời mời kết bạn" để chấp nhận',
          });
        case "ALREADY_FRIENDS":
          return res
            .status(400)
            .json({ message: "Bạn đã là bạn bè với người này rồi" });
        default:
          throw error;
      }
    }
  } catch (e) {
    next(e);
  }
};

exports.accept = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(req.params.id, req.user.sub, "accepted");
    if (!row) return res.status(404).json({ message: "Không tìm thấy lời mời" });

    const unlockedAchievements = await AchievementService.checkAndUnlock(
      req.user.sub,
      { type: "friend_accepted" }
    );

    await AchievementService.checkAndUnlock(row.requester_id, {
      type: "friend_accepted",
    });

    res.json({ friend: row, achievements_unlocked: unlockedAchievements });
  } catch (e) {
    next(e);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(req.params.id, req.user.sub, "rejected");
    if (!row) return res.status(404).json({ message: "Không tìm thấy lời mời" });
    res.json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const row = await Friend.cancel(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ message: "Không tìm thấy lời mời" });
    res.json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.unfriend = async (req, res, next) => {
  try {
    const row = await Friend.unfriend(req.params.id, req.user.sub);
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy mối quan hệ bạn bè" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.suggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const { page, limit } = parsePaging(req, { page: 1, limit: 5 });
    const me = req.user.sub;

    const rels = await db("friends")
      .select("user_low_id", "user_high_id")
      .where(function () {
        this.where({ user_low_id: me }).orWhere({ user_high_id: me });
      });

    const excluded = new Set([me]);
    rels.forEach((r) => {
      excluded.add(r.user_low_id);
      excluded.add(r.user_high_id);
    });

    let baseQuery = db("profiles")
      .join("users", "profiles.user_id", "users.id")
      .whereNotIn("users.id", Array.from(excluded))
      .andWhere("users.is_enabled", true);

    if (q) {
      baseQuery = baseQuery.andWhere(function () {
        this.where("profiles.username", "ilike", `%${q}%`)
          .orWhere("profiles.display_name", "ilike", `%${q}%`)
          .orWhere("users.email", "ilike", `%${q}%`);
      });
    }

    const [{ c: totalRaw }] = await baseQuery.clone().count("* as c");
    const total = Number(totalRaw || 0);

    const suggestions = await baseQuery
      .clone()
      .select(
        "users.id as user_id",
        "users.email",
        "users.created_at",
        "profiles.username",
        "profiles.display_name",
        "profiles.avatar_url",
        "profiles.level",
        "profiles.points",
        "profiles.bio"
      )
      .orderBy("profiles.points", "desc")
      .limit(limit)
      .offset((page - 1) * limit);

    const suggestionsWithMutual = suggestions.map((user) => ({
      ...user,
      mutual_friends: 0,
    }));

    res.json({
      suggestions: suggestionsWithMutual,
      meta: metaFromTotal({ page, limit, total }),
    });
  } catch (e) {
    next(e);
  }
};