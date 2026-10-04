export const ROUTES = {
    WEBHOOKS: '/webhooks',
    WEBHOOK_EVENT: (id) => `/webhooks/${encodeURIComponent(id)}`,
    WEBHOOK_ENDPOINTS: '/settings/webhooks',
    WEBHOOK_NEW: '/settings/webhooks/new',
    WEBHOOK_DETAILS: (id) => `/settings/webhooks/${id}`,
    WEBHOOK_EDIT: (id) => `/settings/webhooks/${id}/edit`,
    DELIVERIES_FOR_WEBHOOK: (id) => `/deliveries?webhookId=${id}`,
};
