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