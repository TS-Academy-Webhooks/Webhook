// src/hooks/useCopyToClipboard.js
import { useState } from 'react';

export function useCopyToClipboard(resetAfterMs = 2000) {
    const [copied, setCopied] = useState(false);

    const copy = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), resetAfterMs);
        } catch {
            // Clipboard access can fail (permissions, insecure context) — the
            // value is still visible/selectable in the UI, so this isn't fatal.
        }
    };

    return [copied, copy];
}