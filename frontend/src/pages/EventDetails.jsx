import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../services/eventService';
import { getDeliveries, resendDelivery } from '../services/deliveryService';
import { formatDate } from '../utils/formatDate';
import { formatEventType } from '../utils/formatEventType';
import { Loader } from '../components/common/Loader';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

export default function EventDetails() {
    const { id } = useParams(); const [event, setEvent] = useState(null); const [deliveries, setDeliveries] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(''); const [message, setMessage] = useState(''); const [copied, copy] = useCopyToClipboard();
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const ev = await getEvent(id); setEvent(ev);
            try { const ds = await getDeliveries({ eventId: ev.id, page: 1, limit: 100 }); setDeliveries(ds.items); }
            catch { setDeliveries([]); }
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [id]);
    useEffect(() => { load(); }, [load]);
    async function retry(deliveryId) { setBusy(deliveryId); setMessage(''); try { await resendDelivery(deliveryId); setMessage('Retry request queued.'); const ds = await getDeliveries({ eventId: event.id, page: 1, limit: 100 }); setDeliveries(ds.items); } catch (e) { setMessage(e.message); } finally { setBusy(''); } }
    if (loading) return <Loader label="Loading event" showLabel />;
    if (error || !event) return <section className="feature-page"><p className="feature-page__error" role="alert">{error || 'Event not found'}</p><Link to="/events">Back to events</Link></section>;
    const payload = JSON.stringify(event.payload ?? {}, null, 2);
    return <section className="feature-page"><header className="feature-page__header"><div><p><Link to="/events">Webhook events</Link></p><h1>{formatEventType(event.type)}</h1></div><div className="feature-page__toolbar"><button onClick={() => copy(payload)}>{copied ? 'Copied payload' : 'Copy payload'}</button><button onClick={() => copy(event.eventId ?? event.id)}>Copy event ID</button></div></header>
        <section className="feature-page__panel"><h2>Event details</h2><dl className="feature-page__definition"><div><dt>Event ID</dt><dd>{event.eventId ?? event.id}</dd></div><div><dt>Type</dt><dd>{event.type}</dd></div><div><dt>Created</dt><dd>{formatDate(event.createdAt, { withTime: true })}</dd></div><div><dt>Shipment</dt><dd>{event.shipment?.trackingNumber ?? event.shipment?.trackingId ?? '—'}</dd></div></dl></section>
        <section className="feature-page__panel"><h2>Payload</h2><pre className="feature-page__code">{payload}</pre></section>
        <section className="feature-page__panel"><h2>Delivery attempts</h2>{message && <p role="status">{message}</p>}{deliveries.length ? <div className="feature-page__table"><table><thead><tr><th>Endpoint</th><th>Status</th><th>HTTP</th><th>Response time</th><th>Created</th><th>Action</th></tr></thead><tbody>{deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.webhook?.name ?? delivery.webhook?.url ?? 'Endpoint'}</td><td>{delivery.status}</td><td>{delivery.httpStatus ?? '—'}</td><td>{delivery.duration ? `${delivery.duration} ms` : '—'}</td><td>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</td><td>{delivery.status === 'failed' && <button disabled={busy === delivery.id} onClick={() => retry(delivery.id)}>{busy === delivery.id ? 'Retrying…' : 'Retry'}</button>}</td></tr>)}</tbody></table></div> : <p className="feature-page__muted">No delivery attempts were returned for this event.</p>}</section>
    </section>;
}
