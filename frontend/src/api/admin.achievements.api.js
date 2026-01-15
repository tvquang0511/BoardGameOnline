import { http } from "./http";

export const adminAchievementsApi = {
  list() {
    return http.get("/admin/achievements").then((r) => r.data);
  },
  create(payload) {
    return http.post("/admin/achievements", payload).then((r) => r.data);
  },
  update(id, payload) {
    return http.patch(`/admin/achievements/${id}`, payload).then((r) => r.data);
  },
  delete(id) {
    return http.delete(`/admin/achievements/${id}`).then((r) => r.data);
  },
  grantToUser(id, userId) {
    return http
      .post(`/admin/achievements/${id}/grant`, { user_id: userId })
      .then((r) => r.data);
  },
  stats() {
    return http.get("/admin/achievements/stats").then((r) => r.data);
  },
};
