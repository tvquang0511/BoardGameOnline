import { http } from "./http";

export const leaderboardApi = {
  get({ gameSlug, scope = "global", limit = 10, range, from, to } = {}) {
    // GET /api/leaderboard?gameSlug=&scope=&limit=&range=&from=&to=
    return http
      .get("/leaderboard", { params: { gameSlug, scope, limit, range, from, to } })
      .then((r) => r.data);
  },
};