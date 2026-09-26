import { WEBHOOK_EVENTS } from '../constants/webhookEvents';

const LABEL_BY_VALUE = Object.fromEntries(
    WEBHOOK_EVENTS.map(({ value, label }) => [value, label])
);

// "shipment.out_for_delivery" -> "Out for delivery"
// Falls back to a generic title-case split for anything not in the list,
// so an unrecognized event type never renders as a raw snake_case string.
export function formatEventType(type) {
    if (!type) return '';
    if (LABEL_BY_VALUE[type]) return LABEL_BY_VALUE[type];

    const withoutPrefix = type.includes('.') ? type.split('.').slice(1).join(' ') : type;
    const words = withoutPrefix.split('_').filter(Boolean);
    if (words.length === 0) return type;

    return words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ');
}