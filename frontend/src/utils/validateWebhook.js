// Pure, framework-free validation for the webhook form.
// Returns a fieldErrors-shaped object: {} means valid.
// Mirrors the backend's own rules where known, so users see the same
// complaint locally before ever hitting the network.

export function validateWebhook({ name, url, events }) {
    const errors = {};

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
        errors.name = 'Name is required.';
    } else if (trimmedName.length < 2 || trimmedName.length > 80) {
        errors.name = 'Name must be 2 to 80 characters.';
    }

    const trimmedUrl = (url || '').trim();
    if (!trimmedUrl) {
        errors.url = 'Endpoint URL is required.';
    } else {
        try {
            const parsed = new URL(trimmedUrl);
            const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);
            const isHttps = parsed.protocol === 'https:';
            const isHttp = parsed.protocol === 'http:';

            if (!isHttps && !(isHttp && isLocalhost)) {
                errors.url = import.meta.env.PROD
                    ? 'URL must be a valid https:// address.'
                    : 'URL must be https://, or http:// on localhost for local testing.';
            }
        } catch {
            errors.url = 'Enter a valid URL, e.g. https://example.com/webhooks.';
        }
    }

    if (!Array.isArray(events) || events.length === 0) {
        errors.events = 'Select at least one event.';
    }

    return errors;
}

export function isValid(fieldErrors) {
    return Object.keys(fieldErrors).length === 0;
}