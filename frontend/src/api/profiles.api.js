import { http } from "./http";

export const profilesApi = {
  me() {
    // GET /api/profiles/me
    return http.get("/profiles/me").then((r) => r.data);
  },
  updateMe(payload) {
    // PATCH /api/profiles/me
    return http.patch("/profiles/me", payload).then((r) => r.data);
  },
  myStats() {
    // GET /api/profiles/me/stats
    return http.get("/profiles/me/stats").then((r) => r.data);
  },
  topAchievements(limit = 4) {
    // GET /api/profiles/me/top-achievements
    return http
      .get("/profiles/me/top-achievements", { params: { limit } })
      .then((r) => r.data);
  },
  favoriteGames(limit = 4) {
    // GET /api/profiles/me/favorite-games
    return http
      .get("/profiles/me/favorite-games", { params: { limit } })
      .then((r) => r.data);
  },
};
