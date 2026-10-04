import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getWebhookEvents } from '../../services/webhooks';
import { MOCK_ORDER_EVENT_TYPES } from '../../data/webhookEvents';
import { WEBHOOK_EVENT_VALUES } from '../../constants/webhookEvents';
import { formatDate } from '../../utils/formatDate';
import { formatEventType } from '../../utils/formatEventType';
import { WebhookStatusBadge } from '../../components/webhooks/WebhookStatusBadge';
import { StatCard } from '../../components/dashboard/StatCard';
import { Pagination } from '../../components/common/Pagination';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';

const eventTypes = [...new Set([...MOCK_ORDER_EVENT_TYPES, ...WEBHOOK_EVENT_VALUES])];
const deliveryStatuses = ['pending', 'delivered', 'failed', 'retrying'];

export default function Webhooks() {
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') ?? ''); const [type, setType] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => { let alive = true; setLoading(true); setError('');
        getWebhookEvents({ page, limit: 10, search, type, status })
            .then((events) => { if (alive) setResult(events); })
            .catch((e) => alive && setError(e.message)).finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [page, search, type, status, refreshKey]);

    return <section className="feature-page"><header className="feature-page__header"><div><h1>Webhooks</h1><p className="feature-page__muted">Inspect event deliveries and monitor your configured endpoints.</p></div><Link to="/settings/webhooks">Manage endpoints →</Link></header>
        <div className="dashboard-page__stats"><StatCard label="Total events" value={result?.stats.total ?? '—'} loading={loading} /><StatCard label="Successful deliveries" value={result?.stats.delivered ?? '—'} loading={loading} /><StatCard label="Failed deliveries" value={result?.stats.failed ?? '—'} loading={loading} /><StatCard label="Pending events" value={result?.stats.pending ?? '—'} loading={loading} /></div>
        <div className="feature-page__toolbar"><input aria-label="Search event ID or order ID" placeholder="Search event ID or order ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /><select aria-label="Filter by event type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">All event types</option>{eventTypes.map((value) => <option key={value} value={value}>{formatEventType(value)}</option>)}</select><select aria-label="Filter by delivery status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All delivery statuses</option>{deliveryStatuses.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></div>
        {result?.demo && <p className="feature-page__demo-note">Sample order events are included because this backend currently publishes shipment events only.</p>}
        {error && <div className="feature-page__error" role="alert"><p>{error}</p><button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Retry</button></div>}
        {loading ? <Loader label="Loading webhook events" showLabel /> : result?.items.length ? <><div className="feature-page__table"><table><thead><tr><th>Event ID</th><th>Event type</th><th>Order ID</th><th>Status</th><th>HTTP status</th><th>Created at</th><th>Delivery time</th><th>Action</th></tr></thead><tbody>{result.items.map((event) => <tr key={event.id}><td><Link to={`/webhooks/${encodeURIComponent(event.id)}`}>{event.eventId}</Link></td><td>{formatEventType(event.type)}</td><td>{event.orderId ?? '—'}</td><td><WebhookStatusBadge status={event.status} /></td><td>{event.httpStatus ?? '—'}</td><td>{formatDate(event.createdAt, { withTime: true })}</td><td>{event.deliveryTime != null ? `${event.deliveryTime} ms` : '—'}</td><td><Link to={`/webhooks/${encodeURIComponent(event.id)}`}>View</Link></td></tr>)}</tbody></table></div><Pagination pagination={result.pagination} onPageChange={setPage} /></> : <EmptyState title="No webhook events yet" description="Events will appear here when your endpoints receive order or shipment updates." />}
    </section>;
}
