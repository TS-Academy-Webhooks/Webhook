import api from './api';
import { parseApiError } from '../utils/apiError';
import { cloneEndpoint, mockWebhookEndpoints } from '../data/webhookEndpoints';
import { mockWebhookEvents } from '../data/webhookEvents';

function normalizeWebhook(webhook) {
    if (!webhook) return webhook;
    return {
        ...webhook,
        id: webhook.id ?? webhook._id,
        isActive: webhook.isActive ?? webhook.active ?? true,
    };
}

// The API returns webhook endpoints as an array and uses `active` and PATCH.

/**
 * @param {{ page?: number, limit?: number, search?: string, active?: boolean }} params
 */
export async function getWebhooks(params = {}) {
    try {
        // The current API returns an unpaginated array. Apply list filters and
        // pagination here so the React page can use one stable result shape.
        const { data } = await api.get('/webhooks');
        const result = data.data;
        const serverItems = Array.isArray(result) ? result : (result.items ?? []);
        const pageInfo = Array.isArray(result) ? null : result.pagination;
        let items = serverItems.map(normalizeWebhook);
        if (params.search) {
            const search = params.search.toLowerCase();
            items = items.filter((webhook) =>
                `${webhook.name ?? ''} ${webhook.url ?? ''}`.toLowerCase().includes(search),
            );
        }
        if (params.active !== undefined) {
            items = items.filter((webhook) => webhook.isActive === params.active);
        }

        const page = params.page ?? pageInfo?.page ?? 1;
        const limit = params.limit ?? pageInfo?.limit ?? (items.length || 10);
        const total = pageInfo?.totalItems ?? pageInfo?.total ?? items.length;
        return {
            items: pageInfo ? items : items.slice((page - 1) * limit, page * limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: pageInfo?.totalPages ?? Math.max(1, Math.ceil(total / limit)),
            },
        };
    } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === null) return paginateMockEndpoints(params);
        throw parsed;
    }
}

export async function getWebhook(id) {
    const mock = mockWebhookEndpoints.find((endpoint) => endpoint.id === id);
    if (mock) return cloneEndpoint(mock);
    try {
        const { data } = await api.get(`/webhooks/${id}`);
        return normalizeWebhook(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

/**
 * @param {{ name: string, url: string, events: string[], isActive?: boolean }} payload
 */
export async function createWebhook(payload) {
    if (payload.description || payload.events?.some((event) => event.startsWith('order.'))) return createMockEndpoint(payload);
    try {
        const { name, url, events } = payload;
        const { data } = await api.post('/webhooks', { name, url, events, active: payload.isActive ?? true });
        // On create, data.data includes the full one-time secret.
        return normalizeWebhook(data.data);
    } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === null) return createMockEndpoint(payload);
        throw parsed;
    }
}

/**
 * Partial update — send only the fields that changed.
 * @param {string} id
 * @param {Partial<{ name: string, url: string, events: string[], isActive: boolean }>} payload
 */
export async function updateWebhook(id, payload) {
    const mock = mockWebhookEndpoints.find((endpoint) => endpoint.id === id);
    if (mock) {
        Object.assign(mock, payload, Object.hasOwn(payload, 'isActive') ? { active: payload.isActive, isActive: payload.isActive } : {});
        mock.updatedAt = new Date();
        return cloneEndpoint(mock);
    }
    if (payload.description || payload.events?.some((event) => event.startsWith('order.'))) throw { message: 'The connected API does not support endpoint descriptions or order.* subscriptions yet. Use a demo endpoint for these settings.' };
    try {
        const apiPayload = { ...payload };
        if (Object.hasOwn(apiPayload, 'isActive')) {
            apiPayload.active = apiPayload.isActive;
            delete apiPayload.isActive;
        }
        const { data } = await api.patch(`/webhooks/${id}`, apiPayload);
        return normalizeWebhook(data.data);
    } catch (error) {
        throw parseApiError(error);
    }
}

// Thin wrapper so call sites read intent-first rather than "update with isActive".
export function toggleWebhook(id, isActive) {
    return updateWebhook(id, { isActive });
}

export async function deleteWebhook(id) {
    const mockIndex = mockWebhookEndpoints.findIndex((endpoint) => endpoint.id === id);
    if (mockIndex >= 0) { mockWebhookEndpoints.splice(mockIndex, 1); return; }
    try {
        await api.delete(`/webhooks/${id}`);
    } catch (error) {
        throw parseApiError(error);
    }
}

/**
 * @param {string} id
 * @param {{ page?: number, limit?: number }} params
 */
export async function getWebhookDeliveries(id, params = {}) {
    if (mockWebhookEndpoints.some((endpoint) => endpoint.id === id)) return getMockEndpointDeliveries(id, params);
    try {
        const { data } = await api.get(`/webhooks/${id}/deliveries`, { params });
        const result = data.data;
        const page = result.pagination ?? {};
        return {
            items: (result.deliveries ?? result.items ?? []).map((delivery) => ({
                ...delivery,
                id: delivery.id ?? delivery._id,
                event: delivery.event ?? delivery.eventId,
            })),
            pagination: {
                page: page.page ?? params.page ?? 1,
                limit: page.limit ?? params.limit ?? 20,
                total: page.totalItems ?? page.total ?? 0,
                totalPages: page.totalPages ?? 1,
            },
        };
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function testWebhook(id, eventType) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { endpointId: id, eventType, status: 'delivered', httpStatus: 200, duration: 245, simulated: true, message: 'Demo test finished; no request was sent to the endpoint.' };
}

export async function regenerateWebhookSecret(id) {
    const endpoint = mockWebhookEndpoints.find((item) => item.id === id);
    if (!endpoint) throw { message: 'Secret regeneration is not supported by the connected API.' };
    endpoint.secret = `whsec_demo_${crypto.randomUUID().replaceAll('-', '')}`;
    return { secret: endpoint.secret, simulated: true };
}

function createMockEndpoint(payload) {
    const now = new Date();
    const id = `wh_demo_${crypto.randomUUID()}`;
    const secret = `whsec_demo_${crypto.randomUUID().replaceAll('-', '')}`;
    const endpoint = { id, ...payload, active: payload.isActive ?? true, isActive: payload.isActive ?? true, createdAt: now, updatedAt: now, secret, isDemo: true };
    mockWebhookEndpoints.unshift(endpoint);
    return cloneEndpoint({ ...endpoint, secret });
}

function paginateMockEndpoints(params = {}) {
    let endpoints = mockWebhookEndpoints.map(cloneEndpoint);
    if (params.search) { const term = params.search.toLowerCase(); endpoints = endpoints.filter((item) => `${item.name} ${item.url}`.toLowerCase().includes(term)); }
    if (params.active !== undefined) endpoints = endpoints.filter((item) => item.isActive === params.active);
    const page = params.page ?? 1; const limit = params.limit ?? 10; const total = endpoints.length;
    return { items: endpoints.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

function getMockEndpointDeliveries(id, params = {}) {
    const endpoint = mockWebhookEndpoints.find((item) => item.id === id);
    const eventRows = mockWebhookEvents.filter((event) => (event.endpointId ?? 'wh_demo_001') === id);
    let items = eventRows.flatMap((event) => event.attempts.map((attempt) => ({
        id: `del_${event.id}_${attempt.attemptNumber}`, event: { id: event.id, _id: event.id, eventId: event.eventId, type: event.type },
        webhook: { id: endpoint.id, name: endpoint.name, url: endpoint.url }, status: attempt.status === 'delivered' ? 'success' : 'failed', httpStatus: attempt.httpStatus, duration: attempt.responseTime, attemptedAt: attempt.attemptedAt, response: attempt.response,
    })));
    if (params.status) items = items.filter((item) => item.status === params.status);
    const page = params.page ?? 1; const limit = params.limit ?? 20; const total = items.length;
    return { items: items.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
