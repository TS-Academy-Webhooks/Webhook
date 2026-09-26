import api from './api';
import { parseApiError } from '../utils/apiError';

// --- Contract reference (confirmed with backend, 2026-09-25) ---------------
// GET    /api/webhooks              -> data: { items, pagination }
// POST   /api/webhooks              -> body: { name, url, events, isActive? }
// GET    /api/webhooks/:id
// PUT    /api/webhooks/:id          -> partial body accepted, e.g. { isActive }
// DELETE /api/webhooks/:id
// GET    /api/webhooks/:id/deliveries -> data: { items, pagination }
// -----------------------------------------------------------------------

/**
 * @param {{ page?: number, limit?: number, search?: string, active?: boolean }} params
 */
export async function getWebhooks(params = {}) {
    try {
        const { data } = await api.get('/webhooks', { params });
        // data.data: { items, pagination }
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

export async function getWebhook(id) {
    try {
        const { data } = await api.get(`/webhooks/${id}`);
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

/**
 * @param {{ name: string, url: string, events: string[], isActive?: boolean }} payload
 */
export async function createWebhook(payload) {
    try {
        const { data } = await api.post('/webhooks', payload);
        // On create, data.data includes the full one-time secret.
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

/**
 * Partial update — send only the fields that changed.
 * @param {string} id
 * @param {Partial<{ name: string, url: string, events: string[], isActive: boolean }>} payload
 */
export async function updateWebhook(id, payload) {
    try {
        const { data } = await api.put(`/webhooks/${id}`, payload);
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}

// Thin wrapper so call sites read intent-first rather than "update with isActive".
export function toggleWebhook(id, isActive) {
    return updateWebhook(id, { isActive });
}

export async function deleteWebhook(id) {
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
    try {
        const { data } = await api.get(`/webhooks/${id}/deliveries`, { params });
        return data.data;
    } catch (error) {
        throw parseApiError(error);
    }
}