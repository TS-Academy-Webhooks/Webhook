// src/hooks/useDebouncedValue.js
import { useEffect, useState } from 'react';

// Returns `value`, but delayed by `delayMs` — resets the timer on every
// change. Use it to avoid firing a search request on every keystroke.
export function useDebouncedValue(value, delayMs = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}