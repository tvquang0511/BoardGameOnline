import { http } from "./http";

export const friendsApi = {
  list({ page = 1, limit = 5 } = {}) {
    return http.get("/friends", { params: { page, limit } }).then((r) => r.data);
  },
  requests({ page = 1, limit = 5 } = {}) {
    return http.get("/friends/requests", { params: { page, limit } }).then((r) => r.data);
  },
  outgoing({ page = 1, limit = 5 } = {}) {
    return http.get("/friends/outgoing", { params: { page, limit } }).then((r) => r.data);
  },
  suggestions({ q, page = 1, limit = 5 } = {}) {
    return http.get("/friends/suggestions", { params: { q, page, limit } }).then((r) => r.data);
  },

  request(userId) {
    return http.post("/friends/request", { userId }).then((r) => r.data);
  },
  accept(id) {
    return http.post(`/friends/${id}/accept`).then((r) => r.data);
  },
  reject(id) {
    return http.post(`/friends/${id}/reject`).then((r) => r.data);
  },
  cancel(id) {
    return http.delete(`/friends/${id}/cancel`).then((r) => r.data);
  },
  unfriend(id) {
    return http.delete(`/friends/${id}/unfriend`).then((r) => r.data);
  },
};