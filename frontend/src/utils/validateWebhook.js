import { WEBHOOK_EVENT_VALUES } from '../constants/webhookEvents';

// Pure, framework-free validation for the webhook form.
// Returns a fieldErrors-shaped object: {} means valid.
// Mirrors the backend's own rules where known, so users see the same
// complaint locally before ever hitting the network.

export function validateWebhook({ name, url, events }) {
    const errors = {};

    const trimmedName = (name || '').trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
        errors.name = 'Name must be 2 to 80 characters.';
    }

    const trimmedUrl = (url || '').trim();
    if (!trimmedUrl) {
        errors.url = 'Endpoint URL is required.';
    } else {
        try {
            const parsed = new URL(trimmedUrl);
            if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
                errors.url = 'Use a valid HTTP(S) URL without embedded credentials.';
            } else if (import.meta.env.PROD && parsed.protocol !== 'https:') {
                errors.url = 'Webhook URLs must use HTTPS in production.';
            }
        } catch {
            errors.url = 'Enter a valid URL, for example https://example.com/webhooks.';
        }
    }

    if (!Array.isArray(events) || events.length === 0) {
        errors.events = 'Select at least one event.';
    } else if (events.some((event) => !WEBHOOK_EVENT_VALUES.includes(event))) {
        errors.events = 'Select only supported shipment event types.';
    }

    return errors;
}

export function isValid(fieldErrors) {
    return Object.keys(fieldErrors).length === 0;
}