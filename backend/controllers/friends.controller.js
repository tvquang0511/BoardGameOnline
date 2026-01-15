const Friend = require("../models/friend.model");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const db = require("../db/knex");
const AchievementService = require("../services/achievement.service");

// Helper để lấy thông tin profile
async function getFriendProfile(userId, currentUserId) {
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

exports.list = async (req, res, next) => {
  try {
    const rows = await Friend.listAccepted(req.user.sub);

    const friends = await Promise.all(
      rows.map(async (rel) => {
        const friendId =
          rel.user_low_id === req.user.sub ? rel.user_high_id : rel.user_low_id;
        const friendProfile = await getFriendProfile(friendId, req.user.sub);

        if (!friendProfile) return null;

        return {
          friendship_id: rel.id, // <-- Đổi tên để rõ ràng
          user_id: friendProfile.id, // <-- User ID của bạn bè
          ...friendProfile,
          status: "accepted",
          created_at: rel.created_at,
          updated_at: rel.updated_at,
        };
      })
    );

    // Lọc bỏ null
    const filteredFriends = friends.filter((f) => f !== null);

    res.json({ friends: filteredFriends });
  } catch (e) {
    next(e);
  }
};

exports.requests = async (req, res, next) => {
  try {
    const rows = await Friend.listIncomingRequests(req.user.sub);

    const requests = await Promise.all(
      rows.map(async (rel) => {
        const requesterProfile = await getFriendProfile(
          rel.requester_id,
          req.user.sub
        );

        if (!requesterProfile) return null;

        return {
          friendship_id: rel.id, // <-- Đổi tên
          requester_id: rel.requester_id,
          user_id: requesterProfile.id, // <-- Thêm user_id
          ...requesterProfile,
          status: rel.status,
          created_at: rel.created_at,
          updated_at: rel.updated_at,
        };
      })
    );

    const filteredRequests = requests.filter((r) => r !== null);
    res.json({ requests: filteredRequests });
  } catch (e) {
    next(e);
  }
};

exports.outgoing = async (req, res, next) => {
  try {
    const rows = await Friend.listOutgoingRequests(req.user.sub);

    const requests = await Promise.all(
      rows.map(async (rel) => {
        const addresseeProfile = await getFriendProfile(
          rel.addressee_id,
          req.user.sub
        );

        if (!addresseeProfile) return null;

        return {
          friendship_id: rel.id, // <-- Đổi tên
          addressee_id: rel.addressee_id,
          user_id: addresseeProfile.id, // <-- Thêm user_id
          ...addresseeProfile,
          status: rel.status,
          created_at: rel.created_at,
          updated_at: rel.updated_at,
        };
      })
    );

    const filteredRequests = requests.filter((r) => r !== null);
    res.json({ requests: filteredRequests });
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
    const row = await Friend.updateStatus(
      req.params.id,
      req.user.sub,
      "accepted"
    );
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy lời mời" });

    // Check friend achievements
    const unlockedAchievements = await AchievementService.checkAndUnlock(
      req.user.sub,
      {
        type: "friend_accepted",
      }
    );

    res.json({ friend: row, achievements_unlocked: unlockedAchievements });
  } catch (e) {
    next(e);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const row = await Friend.updateStatus(
      req.params.id,
      req.user.sub,
      "rejected"
    );
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy lời mời" });
    res.json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const row = await Friend.cancel(req.params.id, req.user.sub);
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy lời mời" });
    res.json({ friend: row });
  } catch (e) {
    next(e);
  }
};

exports.unfriend = async (req, res, next) => {
  try {
    const row = await Friend.unfriend(req.params.id, req.user.sub);
    if (!row)
      return res
        .status(404)
        .json({ message: "Không tìm thấy mối quan hệ bạn bè" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.suggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "15", 10) || 15, 50);
    const me = req.user.sub;

    // Lấy tất cả user đã có mối quan hệ
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

    // Tìm gợi ý
    let query = db("profiles")
      .join("users", "profiles.user_id", "users.id")
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
      .whereNotIn("users.id", Array.from(excluded))
      .andWhere("users.is_enabled", true)
      .andWhere("users.role", "user")
      .orderBy("profiles.points", "desc")
      .limit(limit);

    if (q) {
      query = query.andWhere(function () {
        this.where("profiles.username", "ilike", `%${q}%`)
          .orWhere("profiles.display_name", "ilike", `%${q}%`)
          .orWhere("users.email", "ilike", `%${q}%`);
      });
    }

    const suggestions = await query;

    // Tính số bạn chung (tạm thời để 0)
    const suggestionsWithMutual = suggestions.map((user) => ({
      ...user,
      mutual_friends: 0,
    }));

    res.json({ suggestions: suggestionsWithMutual });
  } catch (e) {
    next(e);
  }
};
