import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWebhookDeliveries } from '../../services/webhookService';
import { resendDelivery } from '../../services/deliveryService';
import { formatEventType } from '../../utils/formatEventType';
import { formatDate } from '../../utils/formatDate';
import { Badge } from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';

export function WebhookDeliveryPanel({ webhookId }) {
    const { user } = useAuth();
    const [recent, setRecent] = useState([]);
    const [counts, setCounts] = useState({ total: null, success: null, failed: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retrying, setRetrying] = useState('');
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [all, success, failed] = await Promise.all([
                getWebhookDeliveries(webhookId, { page: 1, limit: 5 }),
                getWebhookDeliveries(webhookId, { page: 1, limit: 1, status: 'success' }),
                getWebhookDeliveries(webhookId, { page: 1, limit: 1, status: 'failed' }),
            ]);
            setRecent(all.items);
            setCounts({ total: all.pagination.total, success: success.pagination.total, failed: failed.pagination.total });
        } catch (e) { setCounts({ total: null, success: null, failed: null }); setError(e.message); }
        finally { setLoading(false); }
    }, [webhookId]);

    useEffect(() => { load(); }, [load]);

    async function retry(id) {
        setRetrying(id); setNotice('');
        try { await resendDelivery(id); setNotice('Retry submitted.'); await load(); }
        catch (e) { setNotice(e.message); }
        finally { setRetrying(''); }
    }

    return (
        <section className="webhook-details__card webhook-delivery-panel">
            <div className="webhook-delivery-panel__heading"><div><h2>Delivery activity</h2><p className="webhook-details__hint">Recent delivery summaries and their latest attempts.</p></div><Link to={`/webhooks/${encodeURIComponent(webhookId)}/history`}>View full history</Link></div>
            <div className="webhook-delivery-panel__stats">
                <div><span>Delivery summaries</span><strong>{loading ? '—' : (counts.total ?? '—')}</strong></div>
                <div><span>Successful</span><strong>{loading ? '—' : (counts.success ?? '—')}</strong></div>
                <div><span>Failed</span><strong>{loading ? '—' : (counts.failed ?? '—')}</strong></div>
            </div>
            {error && <p className="webhook-details__error" role="alert">{error}</p>}
            {notice && <p role="status" className="webhook-delivery-panel__notice">{notice}</p>}
            {loading ? <p className="webhook-details__hint">Loading delivery history…</p> : recent.length ? <div className="webhook-delivery-panel__table"><table><thead><tr><th>Event</th><th>Status</th><th>Attempts</th><th>HTTP</th><th>Duration</th><th>Last attempt</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{recent.map((delivery) => <tr key={delivery.id}><td>{delivery.event?.eventId && user?.role === 'admin' ? <Link to={`/events/${delivery.event.id ?? delivery.event._id}`}>{delivery.event.eventId}</Link> : (delivery.event?.eventId ?? (delivery.event?.type ? formatEventType(delivery.event.type) : '—'))}</td><td><Badge variant={delivery.status === 'success' ? 'success' : delivery.status === 'failed' ? 'destructive' : 'neutral'}>{delivery.status}</Badge></td><td>{delivery.attemptCount}</td><td>{delivery.httpStatus ?? '—'}</td><td>{delivery.duration != null ? `${delivery.duration} ms` : '—'}</td><td>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</td><td>{delivery.status === 'failed' && <button type="button" disabled={retrying === delivery.id} onClick={() => retry(delivery.id)}>{retrying === delivery.id ? 'Retrying…' : 'Resend'}</button>}</td></tr>)}</tbody></table></div> : <div className="webhook-delivery-panel__empty">No delivery summaries yet. They will appear after a matching shipment event is sent.</div>}
        </section>
    );
}
