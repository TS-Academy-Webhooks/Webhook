// src/utils/formatDate.js

// Formats an ISO date string (or Date, or nullish) into a readable string.
// Never throws: missing or invalid input renders as a placeholder instead
// of "Invalid Date" leaking into the UI.
//
// formatDate('2026-09-21T10:00:00Z')                 -> "Sep 21, 2026"
// formatDate('2026-09-21T10:00:00Z', { withTime: true }) -> "Sep 21, 2026, 10:00 AM"
// formatDate(null)                                   -> "—"

const FALLBACK = '—';

export function formatDate(input, { withTime = false } = {}) {
    if (!input) return FALLBACK;

    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) return FALLBACK;

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime && { hour: 'numeric', minute: '2-digit' }),
    };

    return date.toLocaleString(undefined, options);
}

// For delivery logs / attempt timestamps, where the time is the point.
export function formatDateTime(input) {
    return formatDate(input, { withTime: true });
}