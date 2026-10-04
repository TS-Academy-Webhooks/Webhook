import api from "./api";
import { parseApiError } from "../utils/apiError";
import { mockWebhookEvents } from "../data/webhookEvents";
import { mockWebhookEndpoints } from "../data/webhookEndpoints";
import { getEvent as fetchEvent } from "./eventService";

function normalizeDelivery(delivery) {
    return {
        ...delivery,
        id: delivery.id ?? delivery._id,
        webhook: delivery.webhook ?? delivery.webhookId,
        event: delivery.event ?? delivery.eventId,
    };
}

function getMockDeliveries() {
    return mockWebhookEvents.flatMap((event) =>
        event.attempts.map((attempt) => ({
            id: `del_${event.id}_${attempt.attemptNumber}`,
            event: { id: event.id, eventId: event.eventId, type: event.type },
            webhook: mockWebhookEndpoints.find((endpoint) => endpoint.id === event.endpointId),
            status: attempt.status === "delivered" ? "success" : "failed",
            attemptNumber: attempt.attemptNumber,
            httpStatus: attempt.httpStatus,
            duration: attempt.responseTime,
            attemptedAt: attempt.attemptedAt,
            response: attempt.response,
        })),
    );
}

function getDeliveriesFromMocks(params) {
    let items = getMockDeliveries();
    if (params.status) items = items.filter((item) => item.status === params.status);
    if (params.webhookId) items = items.filter((item) => item.webhook?.id === params.webhookId);
    if (params.eventId) items = items.filter((item) => item.event?.id === params.eventId);
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 20);
    const total = items.length;
    return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
}

export async function getDeliveries(pageOrParams = {}, filters = {}) {
    const params = typeof pageOrParams === "number"
        ? { ...filters, page: pageOrParams }
        : pageOrParams;
    try {
        const { data } = await api.get("/deliveries", { params });
        const result = data.data;
        const items = result.deliveries ?? result.items ?? [];
        const pagination = result.pagination ?? {};
        return {
            items: items.map(normalizeDelivery),
            pagination: {
                page: pagination.page ?? params.page ?? 1,
                limit: pagination.limit ?? params.limit ?? 20,
                total: pagination.totalItems ?? pagination.total ?? items.length,
                totalPages: pagination.totalPages ?? 1,
            },
        };
    } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === null) return getDeliveriesFromMocks(params);
        throw parsed;
    }
}

export async function getDelivery(id) {
    try {
        const { data } = await api.get(`/deliveries/${encodeURIComponent(id)}`);
        return normalizeDelivery(data.data);
    } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === null) {
            const mock = getMockDeliveries().find((delivery) => delivery.id === id);
            if (mock) return mock;
        }
        throw parsed;
    }
}

export async function resendDelivery(id) {
    try {
        const { data } = await api.post(`/deliveries/${encodeURIComponent(id)}/resend`);
        return normalizeDelivery(data.data);
    } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === null) {
            const mock = getMockDeliveries().find((delivery) => delivery.id === id);
            if (mock) {
                return {
                    ...mock,
                    status: "success",
                    httpStatus: 200,
                    attemptedAt: new Date(),
                    response: "Demo retry completed.",
                };
            }
        }
        throw parsed;
    }
}

export const retryDelivery = resendDelivery;

export async function getEvent(id) {
    const event = await fetchEvent(id);
    const deliveries = await getDeliveries({ eventId: event.id, page: 1, limit: 100 });
    return { event, deliveries: deliveries.items };
}
