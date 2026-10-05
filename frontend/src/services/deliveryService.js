import api from "./api";
import { parseApiError } from "../utils/apiError";
import { getEvent as fetchEvent } from "./eventService";

export function normalizeAttempt(attempt) {
    return {
        ...attempt,
        id: attempt.id ?? attempt._id,
        httpStatus: attempt.httpStatus ?? attempt.statusCode ?? null,
        response: attempt.response ?? attempt.responseBody ?? "",
        error: attempt.error ?? attempt.errorMessage ?? null,
        duration: attempt.duration ?? attempt.durationMs ?? null,
        attemptedAt: attempt.attemptedAt ?? attempt.createdAt ?? null,
    };
}

export function normalizeDelivery(delivery) {
    if (!delivery) return delivery;

    const attempts = (delivery.attempts ?? delivery.deliveryAttempts ?? []).map(normalizeAttempt);
    const latestAttempt = [...attempts].sort((first, second) => {
        const attemptDifference = (second.attemptNumber ?? 0) - (first.attemptNumber ?? 0);
        if (attemptDifference !== 0) return attemptDifference;
        return new Date(second.attemptedAt ?? 0) - new Date(first.attemptedAt ?? 0);
    })[0] ?? null;

    return {
        ...delivery,
        id: delivery.id ?? delivery._id,
        webhook: delivery.webhook ?? delivery.webhookId ?? null,
        event: delivery.event ?? delivery.eventId ?? null,
        attempts,
        attemptCount: delivery.attemptCount ?? attempts.length,
        latestAttempt,
        httpStatus: delivery.httpStatus ?? latestAttempt?.httpStatus ?? null,
        duration: delivery.duration ?? latestAttempt?.duration ?? null,
        attemptedAt: delivery.attemptedAt ?? delivery.lastAttemptAt ?? latestAttempt?.attemptedAt ?? null,
    };
}

function normalizePage(result, params) {
    const items = result.items ?? result.deliveries ?? [];
    const pagination = result.pagination ?? {};
    return {
        items: items.map(normalizeDelivery),
        pagination: {
            page: pagination.page ?? Number(params.page ?? 1),
            limit: pagination.limit ?? Number(params.limit ?? 20),
            total: pagination.total ?? pagination.totalItems ?? items.length,
            totalPages: pagination.totalPages ?? 1,
        },
    };
}

export async function getDeliveries(pageOrParams = {}, filters = {}) {
    const params = typeof pageOrParams === "number"
        ? { ...filters, page: pageOrParams }
        : { ...pageOrParams };

    try {
        const { data } = await api.get("/deliveries", { params });
        return normalizePage(data.data ?? {}, params);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getDelivery(id) {
    try {
        const { data } = await api.get(`/deliveries/${encodeURIComponent(id)}`);
        return normalizeDelivery(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function resendDelivery(id) {
    try {
        const { data } = await api.post(`/deliveries/${encodeURIComponent(id)}/resend`);
        return normalizeDelivery(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export const retryDelivery = resendDelivery;

export async function getEvent(id) {
    const event = await fetchEvent(id);
    const deliveries = await getDeliveries({
        eventId: event.id,
        page: 1,
        limit: 100,
    });
    return { event, deliveries: deliveries.items };
}
