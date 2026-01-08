import { http } from "./http";

export const adminApi = {
  users({ q = "", page = 1, limit = 20 } = {}) {
    // GET /api/admin/users?q=&page=&limit=
    return http.get("/admin/users", { params: { q, page, limit } }).then((r) => r.data);
  },
  updateUser(id, payload) {
    // PATCH /api/admin/users/:id
    return http.patch(`/admin/users/${id}`, payload).then((r) => r.data);
  },
  stats() {
    // GET /api/admin/stats
    return http.get("/admin/stats").then((r) => r.data);
  },

  // detailed
  dau(days = 7) {
    // GET /api/admin/statistics/dau?days=
    return http.get("/admin/statistics/dau", { params: { days } }).then((r) => r.data);
  },
  sessionsByHour() {
    // GET /api/admin/statistics/sessions-by-hour
    return http.get("/admin/statistics/sessions-by-hour").then((r) => r.data);
  },
  gameDistribution() {
    // GET /api/admin/statistics/game-distribution
    return http.get("/admin/statistics/game-distribution").then((r) => r.data);
  },
  userGrowth(months = 6) {
    // GET /api/admin/statistics/user-growth?months=
    return http.get("/admin/statistics/user-growth", { params: { months } }).then((r) => r.data);
  },
};