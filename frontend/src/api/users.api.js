import { http } from "./http";

export const usersApi = {
  search({ q, limit = 20 } = {}) {
    // GET /api/users/search?q=&limit=
    return http.get("/users/search", { params: { q, limit } }).then((r) => r.data);
  },
};