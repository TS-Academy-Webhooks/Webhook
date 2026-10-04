// src/pages/webhooks/Webhooks.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    const [searchInput, setSearchInput] = useState('');
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
    } = useWebhooks({ page: 1, limit: 10, search: '', active: undefined });

    // Keep the debounced search value in sync with the hook's params,
    // resetting to page 1 whenever the search term actually changes.
    useEffect(() => {
        setParams({ search: debouncedSearch, page: 1 });
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
        setParams({ active, page: 1 });
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

            {webhooks.some((webhook) => webhook.isDemo) && <p className="feature-page__demo-note">Demo endpoints and changes are stored in browser memory for this session. Connect the endpoint API to persist them.</p>}

            {!isEmpty && (
                <div className="webhooks-page__toolbar">
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by name..."
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
                    <Pagination pagination={pagination} onPageChange={(page) => setParams({ page })} />
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
