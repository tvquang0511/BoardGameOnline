import { http } from "./http";

export const gamesApi = {
  list({ all = false } = {}) {
    // GET /api/games?all=true|false
    return http.get("/games", { params: { all } }).then((r) => r.data);
  },
  getBySlug(slug) {
    // GET /api/games/:slug
    return http.get(`/games/${slug}`).then((r) => r.data);
  },

  // Reviews
  getReviews(gameId, { limit = 50, offset = 0 } = {}) {
    // GET /api/games/:id/reviews
    return http
      .get(`/games/${gameId}/reviews`, { params: { limit, offset } })
      .then((r) => r.data);
  },
  getMyReview(gameId) {
    // GET /api/games/:id/reviews/me
    return http.get(`/games/${gameId}/reviews/me`).then((r) => r.data);
  },
  createReview(gameId, { rating, comment }) {
    // POST /api/games/:id/reviews
    return http
      .post(`/games/${gameId}/reviews`, { rating, comment })
      .then((r) => r.data);
  },
  updateReview(gameId, { rating, comment }) {
    // PATCH /api/games/:id/reviews
    return http
      .patch(`/games/${gameId}/reviews`, { rating, comment })
      .then((r) => r.data);
  },
  deleteReview(gameId) {
    // DELETE /api/games/:id/reviews
    return http.delete(`/games/${gameId}/reviews`).then((r) => r.data);
  },

  getMyRecentGames({ limit = 20, page = 1 } = {}) {
    return http
      .get("/games/me/recent", { params: { limit, page } })
      .then((r) => r.data);
  },
  getMyMostPlayedGame() {
    return http.get("/games/me/most-played").then((r) => r.data);
  },

  // admin
  create(payload) {
    // POST /api/games
    return http.post("/games", payload).then((r) => r.data);
  },
  update(id, payload) {
    // PATCH /api/games/:id
    return http.patch(`/games/${id}`, payload).then((r) => r.data);
  },
};
