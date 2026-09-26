export const ROUTES = {
    WEBHOOKS: '/webhooks',
    WEBHOOK_NEW: '/webhooks/new',
    WEBHOOK_DETAILS: (id) => `/webhooks/${id}`,
    WEBHOOK_EDIT: (id) => `/webhooks/${id}/edit`,
    DELIVERIES_FOR_WEBHOOK: (id) => `/deliveries?webhookId=${id}`,
};