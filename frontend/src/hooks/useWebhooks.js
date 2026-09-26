import { useCallback, useEffect, useRef, useState } from 'react';
import { getWebhooks, toggleWebhook, deleteWebhook } from '../services/webhookService';

const DEFAULT_PARAMS = { page: 1, limit: 10, search: '', active: undefined };

export function useWebhooks(initialParams = {}) {
    const [params, setParams] = useState({ ...DEFAULT_PARAMS, ...initialParams });
    const [webhooks, setWebhooks] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Tracks which row's toggle is mid-flight, so only that row's switch disables.
    const [pendingId, setPendingId] = useState(null);

    // Guards against a slow earlier request overwriting a faster later one
    // (e.g. typing quickly in the search box).
    const requestId = useRef(0);

    const fetchWebhooks = useCallback(async (overrideParams) => {
        const activeParams = overrideParams ?? params;
        const thisRequest = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const { items, pagination: page } = await getWebhooks(activeParams);
            if (thisRequest !== requestId.current) return; // stale response, ignore
            setWebhooks(items);
            setPagination(page);
        } catch (err) {
            if (thisRequest !== requestId.current) return;
            setError(err.message);
        } finally {
            if (thisRequest === requestId.current) setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchWebhooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const updateParams = useCallback((patch) => {
        setParams((prev) => ({ ...prev, ...patch }));
    }, []);

    const toggle = useCallback(async (id, nextIsActive) => {
        setPendingId(id);
        const previous = webhooks;
        // Optimistic update
        setWebhooks((list) =>
            list.map((w) => (w.id === id ? { ...w, isActive: nextIsActive } : w))
        );
        try {
            await toggleWebhook(id, nextIsActive);
        } catch (err) {
            setWebhooks(previous); // rollback
            setError(err.message);
        } finally {
            setPendingId(null);
        }
    }, [webhooks]);

    const remove = useCallback(async (id) => {
        const previous = webhooks;
        setWebhooks((list) => list.filter((w) => w.id !== id));
        try {
            await deleteWebhook(id);
            // If that was the last row on a page beyond the first, step back a page.
            if (previous.length === 1 && params.page > 1) {
                updateParams({ page: params.page - 1 });
            }
        } catch (err) {
            setWebhooks(previous); // rollback
            setError(err.message);
            throw err; // let the modal know delete failed
        }
    }, [webhooks, params.page, updateParams]);

    return {
        webhooks,
        pagination,
        loading,
        error,
        params,
        setParams: updateParams,
        pendingId,
        refetch: () => fetchWebhooks(params),
        toggle,
        remove,
    };
}