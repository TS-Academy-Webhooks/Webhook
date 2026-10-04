export const mockWebhookEndpoints = [
    { id: 'wh_demo_001', name: 'Order events receiver', url: 'https://example.com/api/webhooks', description: 'Demo endpoint for order and shipment events.', active: true, isActive: true, events: ['order.created', 'order.paid', 'order.shipped', 'order.cancelled', 'shipment.delivered'], createdAt: new Date('2026-09-28T09:00:00Z'), updatedAt: new Date('2026-10-03T14:15:00Z'), isDemo: true },
    { id: 'wh_demo_002', name: 'Warehouse notifications', url: 'https://warehouse.example.com/hooks', description: 'Inactive sample endpoint.', active: false, isActive: false, events: ['shipment.picked_up', 'shipment.in_transit'], createdAt: new Date('2026-09-22T11:30:00Z'), updatedAt: new Date('2026-09-30T08:00:00Z'), isDemo: true },
];

export function cloneEndpoint(endpoint) { return { ...endpoint, events: [...(endpoint.events ?? [])] }; }
