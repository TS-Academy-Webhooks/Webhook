import api from './api';
import { parseApiError } from '../utils/apiError';

function normalizeEvent(event) {
    return {
        ...event,
        id: event.id ?? event._id,
        shipment: event.shipment ?? event.shipmentId,
    };
}

export async function getEvents(params = {}) {
    try {
        const { data } = await api.get('/events', { params });
        const result = data.data;
        const items = result.events ?? result.items ?? [];
        const page = result.pagination ?? {};
        return {
            items: items.map(normalizeEvent),
            pagination: {
                page: page.page ?? params.page ?? 1,
                limit: page.limit ?? params.limit ?? 20,
                total: page.totalItems ?? page.total ?? items.length,
                totalPages: page.totalPages ?? 1,
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

export async function getEventsForShipment(shipmentId) {
    const firstPage = await getEvents({ page: 1, limit: 100 });
    const matching = (items) => items.filter((event) => {
        const shipment = event.shipment;
        return String(shipment?._id ?? shipment?.id ?? shipment) === String(shipmentId);
    });
    const results = [...matching(firstPage.items)];

    // The current events endpoint has no shipmentId filter, so scan remaining
    // pages in small batches rather than making one request per page.
    for (let start = 2; start <= firstPage.pagination.totalPages; start += 5) {
        const pages = Array.from(
            { length: Math.min(5, firstPage.pagination.totalPages - start + 1) },
            (_, index) => start + index,
        );
        const batches = await Promise.all(pages.map((page) => getEvents({ page, limit: 100 })));
        for (const batch of batches) results.push(...matching(batch.items));
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
