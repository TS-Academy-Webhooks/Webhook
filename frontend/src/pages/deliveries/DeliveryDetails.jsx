import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDelivery, resendDelivery } from '../../services/deliveryService';
import { formatDate } from '../../utils/formatDate';
import { Loader } from '../../components/common/Loader';

export default function DeliveryDetails() {
    const { id } = useParams(); const [delivery, setDelivery] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [retrying, setRetrying] = useState(false); const [message, setMessage] = useState('');
    const load = useCallback(async () => { setLoading(true); try { setDelivery(await getDelivery(id)); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);
    async function retry() { setRetrying(true); setMessage(''); try { await resendDelivery(id); setMessage('Retry request submitted.'); await load(); } catch (e) { setMessage(e.message); } finally { setRetrying(false); } }
    if (loading) return <Loader label="Loading delivery" showLabel />;
    if (error || !delivery) return <section className="feature-page"><p role="alert" className="feature-page__error">{error || 'Delivery not found'}</p><Link to="/deliveries">Back to deliveries</Link></section>;
    return <section className="feature-page"><header className="feature-page__header"><div><p><Link to="/deliveries">Delivery attempts</Link></p><h1>Delivery details</h1></div>{delivery.status === 'failed' && <button disabled={retrying} onClick={retry}>{retrying ? 'Retrying…' : 'Retry delivery'}</button>}</header>{message && <p role="status">{message}</p>}
        <section className="feature-page__panel"><dl className="feature-page__definition"><div><dt>Delivery ID</dt><dd>{delivery.id}</dd></div><div><dt>Status</dt><dd>{delivery.status}</dd></div><div><dt>HTTP response</dt><dd>{delivery.httpStatus ?? '—'}</dd></div><div><dt>Response time</dt><dd>{delivery.duration ? `${delivery.duration} ms` : '—'}</dd></div><div><dt>Attempted</dt><dd>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</dd></div><div><dt>Endpoint</dt><dd>{delivery.webhook?.name ?? delivery.webhook?.url ?? '—'}</dd></div><div><dt>Event</dt><dd>{delivery.event?.eventId ? <Link to={`/events/${delivery.event.id ?? delivery.event._id}`}>{delivery.event.eventId}</Link> : '—'}</dd></div></dl></section>
        {delivery.response && <section className="feature-page__panel"><h2>HTTP response</h2><pre className="feature-page__code">{delivery.response}</pre></section>}
    </section>;
}
