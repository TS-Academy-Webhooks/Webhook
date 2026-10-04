const at = (iso) => new Date(iso);

export const mockWebhookEvents = [
    {
        id: 'evt_001', eventId: 'evt_001', endpointId: 'wh_demo_001', type: 'order.shipped', orderId: 'ORD-1001', status: 'delivered', httpStatus: 200, responseTime: 245,
        createdAt: at('2026-10-04T11:42:00Z'), payload: { event: 'order.shipped', id: 'evt_001', timestamp: '2026-10-04T11:42:00Z', data: { orderId: 'ORD-1001', trackingNumber: 'TRK-123456', carrier: 'DHL', status: 'shipped' } },
        attempts: [{ attemptNumber: 1, status: 'failed', httpStatus: 500, responseTime: 1200, attemptedAt: at('2026-10-04T11:40:00Z'), response: 'Endpoint returned an internal server error.' }, { attemptNumber: 2, status: 'delivered', httpStatus: 200, responseTime: 245, attemptedAt: at('2026-10-04T11:42:00Z'), response: 'OK' }],
    },
    {
        id: 'evt_002', eventId: 'evt_002', endpointId: 'wh_demo_001', type: 'order.paid', orderId: 'ORD-1002', status: 'delivered', httpStatus: 200, responseTime: 182,
        createdAt: at('2026-10-04T10:10:00Z'), payload: { event: 'order.paid', id: 'evt_002', timestamp: '2026-10-04T10:10:00Z', data: { orderId: 'ORD-1002', amount: 128500, status: 'paid' } },
        attempts: [{ attemptNumber: 1, status: 'delivered', httpStatus: 200, responseTime: 182, attemptedAt: at('2026-10-04T10:10:01Z'), response: 'Accepted' }],
    },
    {
        id: 'evt_003', eventId: 'evt_003', endpointId: 'wh_demo_001', type: 'order.created', orderId: 'ORD-1003', status: 'pending', httpStatus: null, responseTime: null,
        createdAt: at('2026-10-04T07:40:02Z'), payload: { event: 'order.created', id: 'evt_003', timestamp: '2026-10-04T07:40:02Z', data: { orderId: 'ORD-1003', amount: 32000, status: 'created' } }, attempts: [],
    },
    {
        id: 'evt_004', eventId: 'evt_004', endpointId: 'wh_demo_001', type: 'order.cancelled', orderId: 'ORD-1004', status: 'failed', httpStatus: 503, responseTime: 950,
        createdAt: at('2026-10-01T15:10:02Z'), payload: { event: 'order.cancelled', id: 'evt_004', timestamp: '2026-10-01T15:10:02Z', data: { orderId: 'ORD-1004', status: 'cancelled' } },
        attempts: [{ attemptNumber: 1, status: 'failed', httpStatus: 503, responseTime: 950, attemptedAt: at('2026-10-01T15:10:03Z'), response: 'Service unavailable.' }],
    },
];

export const MOCK_ORDER_EVENT_TYPES = ['order.created', 'order.paid', 'order.shipped', 'order.cancelled'];
