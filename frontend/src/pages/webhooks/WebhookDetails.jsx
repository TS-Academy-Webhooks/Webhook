// src/pages/webhooks/WebhookDetails.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWebhook } from '../../hooks/useWebhook';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { WebhookStatus } from '../../components/webhooks/WebhookStatus';
import { SecretField } from '../../components/webhooks/SecretField';
import { DeleteWebhookModal } from '../../components/webhooks/DeleteWebhookModal';
import { WebhookDeliveryPanel } from '../../components/webhooks/WebhookDeliveryPanel';
import { formatEventType } from '../../utils/formatEventType';
import { formatDate } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import { Modal } from '../../components/common/Modal';
import { testWebhook, regenerateWebhookSecret } from '../../services/webhookService';
import { WEBHOOK_EVENT_VALUES } from '../../constants/webhookEvents';
import { MOCK_ORDER_EVENT_TYPES } from '../../data/webhookEvents';
import './WebhookDetails.css';

export default function WebhookDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { webhook, loading, error, notFound, toggle, remove } = useWebhook(id);
    const [copiedUrl, copyUrl] = useCopyToClipboard();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [testDialog, setTestDialog] = useState(false);
    const [testEvent, setTestEvent] = useState('order.shipped');
    const [testing, setTesting] = useState(false);
    const [regenerateDialog, setRegenerateDialog] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [rotatedSecret, setRotatedSecret] = useState('');
    const [notice, setNotice] = useState('');

    // Present only right after creation (Create Webhook navigates here with
    // this in router state). Captured once, on the very first render, so it
    // survives this component's own re-renders without re-reading history.
    const [newSecret] = useState(() => location.state?.newSecret);
    const secretToReveal = rotatedSecret || newSecret;
    const endpointEvents = [...new Set([...MOCK_ORDER_EVENT_TYPES, ...WEBHOOK_EVENT_VALUES])];

    const runTest = async () => {
        setTesting(true); setNotice('Sending test event…');
        try { const result = await testWebhook(webhook.id, testEvent); setNotice(`${result.message} HTTP ${result.httpStatus} · ${result.duration}ms.`); }
        catch (err) { setNotice(err.message); }
        finally { setTesting(false); setTestDialog(false); }
    };

    const runRegenerate = async () => {
        setRegenerating(true); setNotice('');
        try { const result = await regenerateWebhookSecret(webhook.id); setRotatedSecret(result.secret); setNotice('Demo secret regenerated. Copy it now; it will not be available after leaving this page.'); }
        catch (err) { setNotice(err.message); }
        finally { setRegenerating(false); setRegenerateDialog(false); }
    };

    // Browsers persist `history.state` across a page reload, so leaving the
    // secret in router state would let it — and the Copy button that exposes
    // it — keep resurfacing on every refresh of this URL. Scrub it from
    // history immediately after capturing it above, so a reload can never
    // see it again; the API does not return saved secrets on later reads.
    useEffect(() => {
        if (location.state?.newSecret) {
            navigate(location.pathname, { replace: true, state: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <Loader />;

    if (notFound) {
        return (
            <EmptyState
                title="Webhook not found"
                description="It may have been deleted, or the link may be incorrect."
                action={
                    <Button as={Link} to={ROUTES.WEBHOOK_ENDPOINTS} variant="primary">
                        Back to Webhooks
                    </Button>
                }
            />
        );
    }

    if (error) {
        return (
            <div className="webhook-details__error" role="alert">
                <p>{error}</p>
                <Button as={Link} to={ROUTES.WEBHOOK_ENDPOINTS} variant="ghost">
                    Back to Webhooks
                </Button>
            </div>
        );
    }

    if (!webhook) return null;

    const handleDeleteConfirmed = async (webhookId) => {
        await remove(webhookId);
        navigate(ROUTES.WEBHOOK_ENDPOINTS);
    };

    return (
        <div className="webhook-details">
            <div className="webhook-details__header">
                <div>
                    <h1>{webhook.name}</h1>
                    <WebhookStatus
                        isActive={webhook.isActive}
                        webhookName={webhook.name}
                        onToggle={(next) => toggle(next)}
                    />
                </div>
                <div className="webhook-details__actions">
                    <Button variant="secondary" onClick={() => setTestDialog(true)}>Test webhook</Button>
                    <Button as={Link} to={ROUTES.DELIVERIES_FOR_WEBHOOK(webhook.id)} variant="ghost">
                        View delivery logs
                    </Button>
                    <Button as={Link} to={ROUTES.WEBHOOK_EDIT(webhook.id)} variant="secondary">
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                        Delete
                    </Button>
                </div>
            </div>

            <section className="webhook-details__card">
                <h2>Endpoint URL</h2>
                <div className="webhook-details__url-row">
                    <code className="webhook-details__url">{webhook.url}</code>
                    <Button variant="secondary" onClick={() => copyUrl(webhook.url)}>
                        {copiedUrl ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </section>

            {webhook.isDemo && <p className="feature-page__demo-note">This is a demo endpoint. Changes are held in memory and will reset when the app reloads.</p>}

            <section className="webhook-details__card">
                <h2>Subscribed events</h2>
                <div className="webhook-details__events">
                    {webhook.events.map((event) => (
                        <Badge key={event} variant="neutral">
                            {formatEventType(event)}
                        </Badge>
                    ))}
                </div>
            </section>

            <section className="webhook-details__card">
                <h2>Signing secret</h2>
                <p className="webhook-details__hint">
                    Used to verify that a delivery genuinely came from this platform — your
                    receiving server checks it against the <code>X-Webhook-Signature</code> header.
                </p>
                <SecretField value={secretToReveal ?? '••••••••••••••••'} oneTime={Boolean(secretToReveal)} />
                {!secretToReveal && <p className="webhook-details__hint">The endpoint secret is stored securely and cannot be retrieved again. It is shown only when first created or regenerated.</p>}
                <div className="webhook-details__secret-actions"><Button variant="ghost" disabled={!webhook.isDemo} onClick={() => setRegenerateDialog(true)}>Regenerate secret</Button>{!webhook.isDemo && <span className="webhook-details__hint">Secret rotation is not supported by the connected API.</span>}</div>
            </section>

            {notice && <p className="feature-page__notice" role="status">{notice}</p>}

            <WebhookDeliveryPanel webhookId={webhook.id} />

            <section className="webhook-details__card webhook-details__meta">
                <div>
                    <h2>Created</h2>
                    <p>{formatDate(webhook.createdAt)}</p>
                </div>
                <div>
                    <h2>Last updated</h2>
                    <p>{formatDate(webhook.updatedAt)}</p>
                </div>
            </section>

            <DeleteWebhookModal
                webhook={confirmingDelete ? webhook : null}
                onClose={() => setConfirmingDelete(false)}
                onConfirm={handleDeleteConfirmed}
            />
            <Modal isOpen={testDialog} onClose={() => !testing && setTestDialog(false)} title="Send a test webhook">
                <div className="feature-page__form"><p className="feature-page__muted">Choose an event type for a simulated test. The current backend does not provide a test-delivery route.</p><label>Event type<select value={testEvent} onChange={(event) => setTestEvent(event.target.value)}>{endpointEvents.map((event) => <option key={event} value={event}>{formatEventType(event)}</option>)}</select></label><div className="feature-page__form-actions"><Button variant="secondary" onClick={() => setTestDialog(false)} disabled={testing}>Cancel</Button><Button variant="primary" onClick={runTest} loading={testing}>Send test</Button></div></div>
            </Modal>
            <Modal isOpen={regenerateDialog} onClose={() => !regenerating && setRegenerateDialog(false)} title="Regenerate signing secret?">
                <p className="feature-page__muted">This replaces the demo endpoint secret. The new secret is shown once.</p><div className="feature-page__form-actions"><Button variant="secondary" onClick={() => setRegenerateDialog(false)} disabled={regenerating}>Cancel</Button><Button variant="primary" onClick={runRegenerate} loading={regenerating}>Regenerate secret</Button></div>
            </Modal>
        </div>
    );
}
