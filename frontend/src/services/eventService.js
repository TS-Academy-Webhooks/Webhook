import api from "./api";
import { parseApiError } from "../utils/apiError";

function normalizeEvent(event) {
    return {
        ...event,
        id: event.id ?? event._id,
        eventId: event.eventId ?? event.id ?? event._id,
        shipment: event.shipment ?? event.shipmentId ?? null,
    };
}

export async function getEvents(params = {}) {
    try {
        const { data } = await api.get("/events", {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...(params.type ? { type: params.type } : {}),
                ...(params.search?.trim() ? { search: params.search.trim() } : {}),
            },
        });
        const result = data.data ?? {};
        const items = result.items ?? result.events ?? [];
        const pagination = result.pagination ?? {};
        return {
            items: items.map(normalizeEvent),
            pagination: {
                page: pagination.page ?? Number(params.page ?? 1),
                limit: pagination.limit ?? Number(params.limit ?? 20),
                total: pagination.total ?? pagination.totalItems ?? items.length,
                totalPages: pagination.totalPages ?? 1,
            },
        };
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getEvent(id) {
    try {
        const { data } = await api.get(`/events/${encodeURIComponent(id)}`);
        return normalizeEvent(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}
