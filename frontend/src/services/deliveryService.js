import { apiRequest } from "./api";

export function getDeliveries(page = 1, filters = {}) {
  const params = new URLSearchParams({ page, ...filters });
  return apiRequest(`/deliveries?${params}`);
}

export function getDelivery(id) {
  return apiRequest(`/deliveries/${id}`);
}

export function retryDelivery(id) {
  return apiRequest(`/deliveries/${id}/retry`, { method: "POST" });
}

export function getEvent(id) {
  return apiRequest(`/events/${id}`);
}