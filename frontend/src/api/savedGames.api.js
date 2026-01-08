import { http } from "./http";

export const savedGamesApi = {
  list({ gameSlug } = {}) {
    // GET /api/saved-games?gameSlug=
    return http.get("/saved-games", { params: { gameSlug } }).then((r) => r.data);
  },
  create(payload) {
    // POST /api/saved-games
    return http.post("/saved-games", payload).then((r) => r.data);
  },
  getById(id) {
    // GET /api/saved-games/:id
    return http.get(`/saved-games/${id}`).then((r) => r.data);
  },
  remove(id) {
    // DELETE /api/saved-games/:id
    return http.delete(`/saved-games/${id}`).then((r) => r.data);
  },
};