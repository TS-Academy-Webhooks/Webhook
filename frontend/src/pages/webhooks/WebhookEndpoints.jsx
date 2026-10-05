// src/pages/webhooks/Webhooks.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWebhooks } from '../../hooks/useWebhooks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { WebhookTable } from '../../components/webhooks/WebhookTable';
import { DeleteWebhookModal } from '../../components/webhooks/DeleteWebhookModal';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { ROUTES } from '../../constants/routes';
import './Webhooks.css';
import { getDeliveries } from '../../services/deliveryService';
import { StatCard } from '../../components/dashboard/StatCard';

const STATUS_FILTERS = [
    { value: undefined, label: 'All' },
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
];

export default function WebhookEndpoints() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlPage = Math.max(1, Number(searchParams.get('page')) || 1);
    const urlSearch = searchParams.get('search') ?? '';
    const activeValue = searchParams.get('active');
    const urlActive = activeValue === 'true' ? true : activeValue === 'false' ? false : undefined;
    const [searchInput, setSearchInput] = useState(urlSearch);
    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const [webhookPendingDelete, setWebhookPendingDelete] = useState(null);
    const [deliveryCounts, setDeliveryCounts] = useState({ success: null, failed: null });

    const {
        webhooks,
        pagination,
        loading,
        error,
        params,
        setParams,
        pendingId,
        refetch,
        toggle,
        remove,
    } = useWebhooks({ page: urlPage, limit: 10, search: urlSearch, active: urlActive });

    useEffect(() => {
        setSearchInput(urlSearch);
    }, [urlSearch]);

    useEffect(() => {
        if (
            params.page !== urlPage ||
            params.search !== urlSearch ||
            params.active !== urlActive
        ) {
            setParams({ page: urlPage, search: urlSearch, active: urlActive });
        }
    }, [params.active, params.page, params.search, setParams, urlActive, urlPage, urlSearch]);

    function updateParams(patch, { replace = false } = {}) {
        setParams(patch);
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
        }
        if (Object.keys(patch).some((key) => key !== 'page')) next.delete('page');
        setSearchParams(next, { replace });
    }

    useEffect(() => {
        const nextSearch = debouncedSearch.trim();
        if (nextSearch !== params.search) {
            updateParams({ search: nextSearch, page: 1 }, { replace: true });
        }
        // updateParams depends on the current URL query string; the input is intentionally debounced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        let alive = true;
        Promise.all([
            getDeliveries({ page: 1, limit: 1, status: 'success' }),
            getDeliveries({ page: 1, limit: 1, status: 'failed' }),
        ]).then(([success, failed]) => {
            if (alive) setDeliveryCounts({ success: success.pagination.total, failed: failed.pagination.total });
        }).catch(() => {
            if (alive) setDeliveryCounts({ success: '—', failed: '—' });
        });
        return () => { alive = false; };
    }, []);

    const subscribedEventCount = useMemo(() => webhooks.reduce((sum, webhook) => sum + (webhook.events?.length ?? 0), 0), [webhooks]);

    const handleStatusFilter = (active) => {
        updateParams({ active, page: 1 });
    };

    const isEmpty = !loading && !error && webhooks.length === 0 && !params.search && params.active === undefined;
    const isNoResults = !loading && !error && webhooks.length === 0 && (params.search || params.active !== undefined);

    return (
        <div className="webhooks-page">
            <div className="webhooks-page__header">
                <div><h1>Webhook endpoints</h1><p>Manage URLs that receive shipment event notifications.</p></div>
                <Button as={Link} to={ROUTES.WEBHOOK_NEW} variant="primary">＋ New webhook</Button>
            </div>

            <div className="dashboard-page__stats">
                <StatCard label="Configured endpoints" value={pagination?.total ?? webhooks.length} loading={loading} />
                <StatCard label="Subscriptions on this page" value={subscribedEventCount} loading={loading} />
                <StatCard label="Successful deliveries" value={deliveryCounts.success} loading={deliveryCounts.success === null} />
                <StatCard label="Failed deliveries" value={deliveryCounts.failed} loading={deliveryCounts.failed === null} />
            </div>

            {!isEmpty && (
                <div className="webhooks-page__toolbar">
                    <Input
                        value={searchInput}
                        maxLength={100}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by name…"
                        aria-label="Search webhooks"
                    />
                    <div className="webhooks-page__filters" role="group" aria-label="Filter by status">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={String(filter.value)}
                                type="button"
                                className={`webhooks-page__filter-chip ${
                                    params.active === filter.value ? 'webhooks-page__filter-chip--active' : ''
                                }`}
                                aria-pressed={params.active === filter.value}
                                onClick={() => handleStatusFilter(filter.value)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading && <Loader />}

            {error && !loading && (
                <div className="webhooks-page__error" role="alert">
                    <p>{error}</p>
                    <Button variant="ghost" onClick={refetch}>
                        Retry
                    </Button>
                </div>
            )}

            {isEmpty && (
                <EmptyState
                    title="No webhooks yet"
                    description="Create a webhook to start receiving shipment events on your own server."
                    action={
                        <Button as={Link} to={ROUTES.WEBHOOK_NEW} variant="primary">
                            Create Webhook
                        </Button>
                    }
                />
            )}

            {isNoResults && (
                <EmptyState
                    title="No webhooks match your search"
                    description="Try a different name or clear the status filter."
                />
            )}

            {!loading && !error && webhooks.length > 0 && (
                <>
                    <WebhookTable
                        webhooks={webhooks}
                        pendingId={pendingId}
                        onToggle={toggle}
                        onDeleteRequest={setWebhookPendingDelete}
                    />
                    <Pagination pagination={pagination} onPageChange={(page) => updateParams({ page })} />
                </>
            )}

            <DeleteWebhookModal
                webhook={webhookPendingDelete}
                onClose={() => setWebhookPendingDelete(null)}
                onConfirm={remove}
            />
        </div>
    );
}
