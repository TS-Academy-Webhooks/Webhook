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
import { formatEventType } from '../../utils/formatEventType';
import { formatDate } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import './WebhookDetails.css';

export default function WebhookDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { webhook, loading, error, notFound, toggle, remove } = useWebhook(id);
    const [copiedUrl, copyUrl] = useCopyToClipboard();
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Present only right after creation (Create Webhook navigates here with
    // this in router state). Captured once, on the very first render, so it
    // survives this component's own re-renders without re-reading history.
    const [newSecret] = useState(() => location.state?.newSecret);

    // Browsers persist `history.state` across a page reload, so leaving the
    // secret in router state would let it — and the Copy button that exposes
    // it — keep resurfacing on every refresh of this URL. Scrub it from
    // history immediately after capturing it above, so a reload can never
    // see it again; only the masked `webhook.secret` remains reachable.
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
                    <Button as={Link} to={ROUTES.WEBHOOKS} variant="primary">
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
                <Button as={Link} to={ROUTES.WEBHOOKS} variant="ghost">
                    Back to Webhooks
                </Button>
            </div>
        );
    }

    if (!webhook) return null;

    const handleDeleteConfirmed = async (webhookId) => {
        await remove(webhookId);
        navigate(ROUTES.WEBHOOKS);
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
                <SecretField value={newSecret ?? webhook.secret} oneTime={Boolean(newSecret)} />
            </section>

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
        </div>
    );
}