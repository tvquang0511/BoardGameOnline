import { http } from "./http";

export const friendsApi = {
  list() {
    // GET /api/friends
    return http.get("/friends").then((r) => r.data);
  },
  requests() {
    // GET /api/friends/requests (incoming)
    return http.get("/friends/requests").then((r) => r.data);
  },
  outgoing() {
    // GET /api/friends/outgoing
    return http.get("/friends/outgoing").then((r) => r.data);
  },
  suggestions({ q, limit = 15 } = {}) {
    // GET /api/friends/suggestions?q=&limit=15
    return http.get("/friends/suggestions", { params: { q, limit } }).then((r) => r.data);
  },
  request(userId) {
    // POST /api/friends/request
    return http.post("/friends/request", { userId }).then((r) => r.data);
  },
  accept(id) {
    // POST /api/friends/:id/accept
    return http.post(`/friends/${id}/accept`).then((r) => r.data);
  },
  reject(id) {
    // POST /api/friends/:id/reject
    return http.post(`/friends/${id}/reject`).then((r) => r.data);
  },
  cancel(id) {
    // DELETE /api/friends/:id/cancel
    return http.delete(`/friends/${id}/cancel`).then((r) => r.data);
  },
  unfriend(id) {
    // DELETE /api/friends/:id/unfriend
    return http.delete(`/friends/${id}/unfriend`).then((r) => r.data);
  },
  
  // Thêm API search riêng
  searchUsers({ q, limit = 20 } = {}) {
    // Gọi API users search nếu có, nếu không thì dùng suggestions
    return http.get("/users/search", { params: { q, limit } }).then((r) => r.data);
  }
};