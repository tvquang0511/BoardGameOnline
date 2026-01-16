import { http } from "./http";

export const leaderboardApi = {
  /**
   * Get leaderboard with pagination
   * @param {string} gameSlug - Game slug (optional) - if provided, ranks by total score in that game
   * @param {string} scope - 'global' | 'friends' | 'me'
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   *
   * Without gameSlug: Ranks by total profile points (overall)
   * With gameSlug: Ranks by total score in that specific game
   */
  get({ gameSlug, scope = "global", page = 1, limit = 10 } = {}) {
    return http
      .get("/leaderboard", {
        params: { gameSlug, scope, page, limit },
      })
      .then((r) => r.data);
  },
};
