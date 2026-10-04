import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getWebhookEvent, retryWebhook } from '../../services/webhooks';
import { formatDate } from '../../utils/formatDate';
import { Loader } from '../common/Loader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { WebhookStatusBadge } from './WebhookStatusBadge';
import { WebhookPayloadViewer } from './WebhookPayloadViewer';
import { WebhookDeliveryAttempts } from './WebhookDeliveryAttempts';

export default function WebhookEventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    const [confirming, setConfirming] = useState(false); const [retrying, setRetrying] = useState(false); const [notice, setNotice] = useState(''); const [copyState, setCopyState] = useState('');
    const load = useCallback(async () => { setLoading(true); setError(''); try { setEvent(await getWebhookEvent(id)); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);

    async function copy(value, label) { try { await navigator.clipboard.writeText(value); setCopyState(`${label} copied`); } catch { setCopyState('Clipboard access is unavailable.'); } }
    async function confirmRetry() {
        setRetrying(true); setNotice('Retrying webhook delivery…');
        try { const result = await retryWebhook(id); setEvent(result.simulated ? result : await getWebhookEvent(id)); setNotice(result.simulated ? 'Demo retry delivered successfully. No real endpoint was contacted.' : 'Retry submitted to the endpoint.'); }
        catch (e) { setNotice(e.message); }
        finally { setRetrying(false); setConfirming(false); }
    }

    if (loading) return <Loader label="Loading webhook event" showLabel />;
    if (error || !event) return <section className="feature-page"><p className="feature-page__error" role="alert">{error || 'Webhook event not found'}</p><Link to="/webhooks">Back to webhook events</Link></section>;
    return <section className="feature-page"><header className="feature-page__header"><div><p><Link to="/webhooks">Webhook events</Link></p><h1>{event.type}</h1></div><div className="feature-page__toolbar"><Button variant="secondary" onClick={() => copy(event.eventId ?? event.id, 'Event ID')}>Copy event ID</Button><Button variant={event.status === 'failed' ? 'primary' : 'secondary'} onClick={() => setConfirming(true)} disabled={retrying}>{retrying ? 'Retrying…' : 'Retry webhook'}</Button></div></header>
        {event.source !== 'api' && <p className="feature-page__demo-note">Demo event · simulated payload and delivery history</p>}
        {notice && <p role="status" className="feature-page__notice">{notice}</p>}{copyState && <p role="status" className="feature-page__muted">{copyState}</p>}
        <section className="feature-page__panel"><h2>Event information</h2><dl className="feature-page__definition"><div><dt>Event ID</dt><dd>{event.eventId ?? event.id}</dd></div><div><dt>Event type</dt><dd>{event.type}</dd></div><div><dt>Order ID</dt><dd>{event.orderId ?? '—'}</dd></div><div><dt>Created at</dt><dd>{formatDate(event.createdAt, { withTime: true })}</dd></div><div><dt>Delivery status</dt><dd><WebhookStatusBadge status={event.status} /></dd></div><div><dt>HTTP status</dt><dd>{event.httpStatus ?? '—'}</dd></div><div><dt>Response time</dt><dd>{event.responseTime != null ? `${event.responseTime} ms` : '—'}</dd></div></dl></section>
        <WebhookPayloadViewer payload={event.payload} />
        <WebhookDeliveryAttempts attempts={event.attempts ?? []} />
        <Modal isOpen={confirming} onClose={() => !retrying && setConfirming(false)} title="Retry webhook delivery?">
            <p className="feature-page__muted">This will submit another delivery attempt for <strong>{event.eventId ?? event.id}</strong>. Successful events can also be retried.</p>
            {event.source !== 'api' && <p className="feature-page__demo-note">This sample event uses a simulated retry. It will not contact a real endpoint.</p>}
            <div className="feature-page__form-actions"><Button variant="secondary" onClick={() => setConfirming(false)} disabled={retrying}>Cancel</Button><Button variant="primary" onClick={confirmRetry} loading={retrying}>Confirm retry</Button></div>
        </Modal>
    </section>;
}
