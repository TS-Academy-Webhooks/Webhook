import { useCallback, useEffect, useState } from 'react';
import { getWebhook, updateWebhook, toggleWebhook, deleteWebhook } from '../services/webhookService';

export function useWebhook(id) {
    const [webhook, setWebhook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const fetchWebhook = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const data = await getWebhook(id);
            setWebhook(data);
        } catch (err) {
            if (err.status === 404) {
                setNotFound(true);
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchWebhook();
    }, [fetchWebhook]);

    // Returns the updated webhook on success, or throws a parsed API error
    // (with .fieldErrors) so the form can show field-level messages.
    const update = useCallback(async (payload) => {
        const updated = await updateWebhook(id, payload);
        setWebhook(updated);
        return updated;
    }, [id]);

    const toggle = useCallback(async (nextIsActive) => {
        const previous = webhook;
        setWebhook((w) => (w ? { ...w, isActive: nextIsActive } : w));
        try {
            const updated = await toggleWebhook(id, nextIsActive);
            setWebhook(updated);
        } catch (err) {
            setWebhook(previous); // rollback
            setError(err.message);
            throw err;
        }
    }, [id, webhook]);

    const remove = useCallback(async () => {
        await deleteWebhook(id);
    }, [id]);

    return { webhook, loading, error, notFound, refetch: fetchWebhook, update, toggle, remove };
}