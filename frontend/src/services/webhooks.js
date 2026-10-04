import { mockWebhookEvents } from '../data/webhookEvents';
import { getEvents } from './eventService';
import { getDeliveries, resendDelivery } from './deliveryService';
import { getEvent } from './eventService';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deliveryStatus = (status) => status === 'success' ? 'delivered' : status === 'failed' ? 'failed' : 'pending';

async function liveEvents() {
    const [eventsResult, deliveryResult] = await Promise.allSettled([
        getEvents({ page: 1, limit: 100 }),
        getDeliveries({ page: 1, limit: 100 }),
    ]);
    if (eventsResult.status !== 'fulfilled') return [];
    const deliveries = deliveryResult.status === 'fulfilled' ? deliveryResult.value.items : [];
    const latestDelivery = new Map();
    for (const delivery of deliveries) {
        const key = delivery.event?.id ?? delivery.event?._id ?? delivery.event;
        const old = latestDelivery.get(String(key));
        if (!old || new Date(delivery.attemptedAt ?? delivery.createdAt) > new Date(old.attemptedAt ?? old.createdAt)) latestDelivery.set(String(key), delivery);
    }
    return eventsResult.value.items.map((event) => {
        const delivery = latestDelivery.get(String(event.id));
        const payload = event.payload ?? {};
        return {
            ...event,
            eventId: event.eventId ?? event.id,
            type: event.type,
            orderId: payload.orderId ?? payload.data?.orderId ?? null,
            status: delivery ? deliveryStatus(delivery.status) : 'pending',
            httpStatus: delivery?.httpStatus ?? null,
            responseTime: delivery?.duration ?? null,
            deliveryTime: delivery?.duration ?? null,
            attempts: delivery ? [{ ...delivery, attemptNumber: delivery.attemptNumber ?? 1, status: deliveryStatus(delivery.status), responseTime: delivery.duration, attemptedAt: delivery.attemptedAt ?? delivery.createdAt }] : [],
            source: 'api',
        };
    });
}

export async function getWebhookEvents({ page = 1, limit = 10, search = '', type = '', status = '' } = {}) {
    const apiEvents = await liveEvents();
    const sourceEvents = [...mockWebhookEvents, ...apiEvents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const term = search.trim().toLowerCase();
    const items = sourceEvents.filter((event) => (!type || event.type === type) && (!status || event.status === status) && (!term || `${event.eventId} ${event.orderId ?? ''}`.toLowerCase().includes(term)));
    return { items: items.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) }, demo: true, apiEventCount: apiEvents.length, stats: { total: sourceEvents.length, delivered: sourceEvents.filter((event) => event.status === 'delivered').length, failed: sourceEvents.filter((event) => event.status === 'failed').length, pending: sourceEvents.filter((event) => event.status === 'pending' || event.status === 'retrying').length } };
}

export async function getWebhookEvent(id) {
    const mock = mockWebhookEvents.find((event) => event.id === id || event.eventId === id);
    if (mock) return mock;
    const event = await getEvent(id);
    const deliveryPage = await getDeliveries({ eventId: event.id, page: 1, limit: 100 });
    const attempts = deliveryPage.items.map((attempt) => ({ ...attempt, status: deliveryStatus(attempt.status), responseTime: attempt.duration, attemptedAt: attempt.attemptedAt ?? attempt.createdAt }));
    const latest = attempts[0];
    return { ...event, eventId: event.eventId ?? event.id, orderId: event.payload?.orderId ?? event.payload?.data?.orderId ?? null, status: latest?.status ?? 'pending', httpStatus: latest?.httpStatus ?? null, responseTime: latest?.responseTime ?? null, attempts, source: 'api' };
}

export async function retryWebhook(id) {
    const mock = mockWebhookEvents.find((event) => event.id === id || event.eventId === id);
    if (mock) {
        mock.status = 'retrying';
        await delay(650);
        const now = new Date();
        const attempt = { attemptNumber: mock.attempts.length + 1, status: 'delivered', httpStatus: 200, responseTime: 245, attemptedAt: now, response: 'Demo delivery accepted.' };
        mock.attempts.push(attempt); mock.status = 'delivered'; mock.httpStatus = 200; mock.responseTime = attempt.responseTime; mock.createdAt = now;
        return { ...mock, simulated: true };
    }
    const failed = await getDeliveries({ eventId: id, page: 1, limit: 100, status: 'failed' });
    if (!failed.items.length) throw { message: 'No failed delivery attempts are available to retry.' };
    return resendDelivery(failed.items[0].id);
}

export async function testWebhook(endpointId, eventType) {
    await delay(700);
    return { endpointId, eventType, status: 'delivered', httpStatus: 200, responseTime: 245, simulated: true, message: 'Demo test completed. No request was sent to the endpoint.' };
}
