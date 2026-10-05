export const ROUTES = {
    DASHBOARD: '/dashboard',
    SHIPMENTS: '/shipments',
    SHIPMENT_NEW: '/shipments/new',
    SHIPMENT_DETAILS: (id) => `/shipments/${encodeURIComponent(id)}`,
    WEBHOOKS: '/webhooks',
    WEBHOOK_EVENT: (id) => `/events/${encodeURIComponent(id)}`,
    WEBHOOK_ENDPOINTS: '/webhooks',
    WEBHOOK_NEW: '/webhooks/new',
    WEBHOOK_DETAILS: (id) => `/webhooks/${encodeURIComponent(id)}`,
    WEBHOOK_EDIT: (id) => `/webhooks/${encodeURIComponent(id)}/edit`,
    DELIVERIES_FOR_WEBHOOK: (id) => `/webhooks/${encodeURIComponent(id)}/history`,
};
