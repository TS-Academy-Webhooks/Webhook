import api from "./api";
import { parseApiError } from "../utils/apiError";
import { normalizeDelivery } from "./deliveryService";

function normalizeWebhook(webhook) {
    if (!webhook) return webhook;
    return {
        ...webhook,
        id: webhook.id ?? webhook._id,
        events: Array.isArray(webhook.events) ? webhook.events : [],
        isActive: webhook.isActive ?? webhook.active ?? true,
    };
}

function normalizePage(result, params) {
    const items = result.items ?? result.webhooks ?? [];
    const pagination = result.pagination ?? {};
    return {
        items: items.map(normalizeWebhook),
        pagination: {
            page: pagination.page ?? Number(params.page ?? 1),
            limit: pagination.limit ?? Number(params.limit ?? 10),
            total: pagination.total ?? pagination.totalItems ?? items.length,
            totalPages: pagination.totalPages ?? 1,
        },
    };
}

function normalizeDeliveryPage(result, params) {
    const items = result.items ?? result.deliveries ?? [];
    const pagination = result.pagination ?? {};
    return {
        items: items.map(normalizeDelivery),
        pagination: {
            page: pagination.page ?? Number(params.page ?? 1),
            limit: pagination.limit ?? Number(params.limit ?? 10),
            total: pagination.total ?? pagination.totalItems ?? items.length,
            totalPages: pagination.totalPages ?? 1,
        },
    };
}

export async function getWebhooks(params = {}) {
    try {
        const { data } = await api.get("/webhooks", {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 10,
                ...(params.search?.trim() ? { search: params.search.trim() } : {}),
                ...(params.active !== undefined ? { active: params.active } : {}),
                ...(params.event ? { event: params.event } : {}),
            },
        });
        return normalizePage(data.data ?? {}, params);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getWebhook(id) {
    try {
        const { data } = await api.get(`/webhooks/${encodeURIComponent(id)}`);
        return normalizeWebhook(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function createWebhook(payload) {
    const request = {
        name: payload.name.trim(),
        url: payload.url.trim(),
        events: [...payload.events],
        active: payload.isActive ?? payload.active ?? true,
    };

    try {
        const { data } = await api.post("/webhooks", request);
        return normalizeWebhook(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function updateWebhook(id, payload) {
    const request = {};
    for (const key of ["name", "url", "events", "regenerateSecret"]) {
        if (Object.hasOwn(payload, key)) request[key] = payload[key];
    }
    if (Object.hasOwn(payload, "isActive")) request.active = payload.isActive;
    else if (Object.hasOwn(payload, "active")) request.active = payload.active;

    try {
        const { data } = await api.patch(`/webhooks/${encodeURIComponent(id)}`, request);
        return normalizeWebhook(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

export function toggleWebhook(id, isActive) {
    return updateWebhook(id, { isActive });
}

export async function deleteWebhook(id) {
    try {
        await api.delete(`/webhooks/${encodeURIComponent(id)}`);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getWebhookDeliveries(id, params = {}) {
    try {
        const { data } = await api.get(
            `/webhooks/${encodeURIComponent(id)}/deliveries`,
            {
                params: {
                    page: params.page ?? 1,
                    limit: params.limit ?? 10,
                    ...(params.status ? { status: params.status } : {}),
                },
            },
        );
        return normalizeDeliveryPage(data.data ?? {}, params);
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function testWebhook(id) {
    try {
        const { data } = await api.post(`/webhooks/${encodeURIComponent(id)}/test`);
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function regenerateWebhookSecret(id) {
    const updated = await updateWebhook(id, { regenerateSecret: true });
    return {
        webhook: updated,
        secret: updated.secret ?? null,
    };
}

export { normalizeDelivery };
