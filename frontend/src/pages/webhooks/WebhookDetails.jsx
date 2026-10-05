import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useWebhook } from "../../hooks/useWebhook";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Loader } from "../../components/common/Loader";
import { EmptyState } from "../../components/common/EmptyState";
import { WebhookStatus } from "../../components/webhooks/WebhookStatus";
import { SecretField } from "../../components/webhooks/SecretField";
import { DeleteWebhookModal } from "../../components/webhooks/DeleteWebhookModal";
import { WebhookDeliveryPanel } from "../../components/webhooks/WebhookDeliveryPanel";
import { formatEventType } from "../../utils/formatEventType";
import { formatDate } from "../../utils/formatDate";
import { ROUTES } from "../../constants/routes";
import { Modal } from "../../components/common/Modal";
import { regenerateWebhookSecret, testWebhook } from "../../services/webhookService";
import "./WebhookDetails.css";

export default function WebhookDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { webhook, loading, error, notFound, toggle, remove } = useWebhook(id);
    const [copiedUrl, copyUrl] = useCopyToClipboard();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [testDialog, setTestDialog] = useState(false);
    const [testing, setTesting] = useState(false);
    const [regenerateDialog, setRegenerateDialog] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [rotatedSecret, setRotatedSecret] = useState("");
    const [notice, setNotice] = useState("");
    const [noticeIsError, setNoticeIsError] = useState(false);
    const [newSecret] = useState(() => location.state?.newSecret ?? "");
    const secretToReveal = rotatedSecret || newSecret;

    useEffect(() => {
        if (location.state?.newSecret) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state?.newSecret, navigate]);

    if (loading) return <Loader label="Loading webhook" showLabel />;
    if (notFound) {
        return (
            <EmptyState
                title="Webhook not found"
                description="It may have been deleted, or you may not have permission to view it."
                action={<Button as={Link} to={ROUTES.WEBHOOK_ENDPOINTS}>Back to webhooks</Button>}
            />
        );
    }
    if (error) {
        return (
            <div className="webhook-details__error" role="alert">
                <p>{error}</p>
                <Button as={Link} to={ROUTES.WEBHOOK_ENDPOINTS} variant="ghost">Back to webhooks</Button>
            </div>
        );
    }
    if (!webhook) return null;

    async function runTest() {
        setTesting(true);
        setNotice("");
        setNoticeIsError(false);
        try {
            await testWebhook(webhook.id);
            setNotice("Test event queued. Review its delivery summary on the Deliveries page.");
            setTestDialog(false);
        } catch (requestError) {
            setNotice(requestError.message);
            setNoticeIsError(true);
        } finally {
            setTesting(false);
        }
    }

    async function runRegenerate() {
        setRegenerating(true);
        setNotice("");
        setNoticeIsError(false);
        try {
            const result = await regenerateWebhookSecret(webhook.id);
            if (!result.secret) throw new Error("The server did not return the regenerated secret. Check the webhook before trying again.");
            setRotatedSecret(result.secret);
            setNotice("Signing secret regenerated. Copy and store it now; it will not be available again after leaving this page.");
            setRegenerateDialog(false);
        } catch (requestError) {
            setNotice(requestError.message);
            setNoticeIsError(true);
        } finally {
            setRegenerating(false);
        }
    }

    async function handleToggle(next) {
        setNotice("");
        setNoticeIsError(false);
        try {
            await toggle(next);
        } catch (requestError) {
            setNotice(requestError.message);
            setNoticeIsError(true);
        }
    }

    async function handleDeleteConfirmed(webhookId) {
        await remove(webhookId);
        navigate(ROUTES.WEBHOOK_ENDPOINTS);
    }

    return (
        <div className="webhook-details">
            <header className="webhook-details__header">
                <div className="webhook-details__identity">
                    <p><Link to={ROUTES.WEBHOOK_ENDPOINTS}>Webhooks</Link></p>
                    <h1>{webhook.name}</h1>
                    <p className="webhook-details__url-text">{webhook.url}</p>
                    <WebhookStatus
                        isActive={webhook.isActive}
                        webhookName={webhook.name}
                        onToggle={handleToggle}
                    />
                </div>
                <div className="webhook-details__actions">
                    <Button variant="secondary" onClick={() => setTestDialog(true)} disabled={!webhook.isActive}>Send test</Button>
                    <Button as={Link} to={ROUTES.DELIVERIES_FOR_WEBHOOK(webhook.id)} variant="ghost">View history</Button>
                    <Button as={Link} to={ROUTES.WEBHOOK_EDIT(webhook.id)} variant="secondary">Edit</Button>
                    <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>Delete</Button>
                </div>
            </header>

            {notice && (
                <p className={noticeIsError ? "feature-page__error" : "feature-page__notice"} role={noticeIsError ? "alert" : "status"} aria-live={noticeIsError ? undefined : "polite"}>
                    {notice}
                </p>
            )}

            <section className="webhook-details__card">
                <h2>Endpoint URL</h2>
                <div className="webhook-details__url-row">
                    <code className="webhook-details__url">{webhook.url}</code>
                    <Button variant="secondary" onClick={() => copyUrl(webhook.url)}>{copiedUrl ? "Copied!" : "Copy URL"}</Button>
                </div>
                {copiedUrl && <span className="sr-only" role="status" aria-live="polite">Webhook URL copied.</span>}
            </section>

            <section className="webhook-details__card">
                <h2>Subscribed events</h2>
                <div className="webhook-details__events">
                    {webhook.events.map((event) => (
                        <Badge key={event} variant="neutral">{formatEventType(event)}</Badge>
                    ))}
                    {!webhook.events.length && <p className="webhook-details__hint">No events are subscribed.</p>}
                </div>
            </section>

            <section className="webhook-details__card">
                <h2>Signing secret</h2>
                <p className="webhook-details__hint">
                    Verify requests with the <code>X-Webhook-Signature</code> header and this endpoint’s secret.
                    Secrets are masked on reads and shown in full only when created or regenerated.
                </p>
                <SecretField value={secretToReveal || webhook.secret || "••••••••••••••••"} oneTime={Boolean(secretToReveal)} />
                {!secretToReveal && (
                    <div className="webhook-details__secret-actions">
                        <p className="webhook-details__hint">The existing secret cannot be retrieved.</p>
                        <Button variant="secondary" onClick={() => setRegenerateDialog(true)}>Regenerate secret</Button>
                    </div>
                )}
                {secretToReveal && (
                    <div className="webhook-details__secret-actions">
                        <Button variant="secondary" onClick={() => setRegenerateDialog(true)}>Regenerate again</Button>
                    </div>
                )}
            </section>

            <WebhookDeliveryPanel webhookId={webhook.id} />

            <section className="webhook-details__card webhook-details__meta">
                <div><h2>Created</h2><p>{formatDate(webhook.createdAt, { withTime: true })}</p></div>
                <div><h2>Last updated</h2><p>{formatDate(webhook.updatedAt, { withTime: true })}</p></div>
            </section>

            <DeleteWebhookModal
                webhook={confirmingDelete ? webhook : null}
                onClose={() => setConfirmingDelete(false)}
                onConfirm={handleDeleteConfirmed}
            />
            <Modal isOpen={testDialog} onClose={() => !testing && setTestDialog(false)} title="Send a test event">
                <div className="feature-page__form">
                    <p className="feature-page__muted">Waybridge will queue a real <code>webhook.test</code> delivery to this active endpoint. The result will appear in delivery history.</p>
                    <div className="feature-page__form-actions">
                        <Button variant="secondary" onClick={() => setTestDialog(false)} disabled={testing}>Cancel</Button>
                        <Button variant="primary" onClick={() => void runTest()} loading={testing}>Queue test</Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={regenerateDialog} onClose={() => !regenerating && setRegenerateDialog(false)} title="Regenerate signing secret?">
                <p className="feature-page__muted">This immediately replaces the current secret. Update your receiver configuration; the new value is shown once.</p>
                <div className="feature-page__form-actions">
                    <Button variant="secondary" onClick={() => setRegenerateDialog(false)} disabled={regenerating}>Cancel</Button>
                    <Button variant="primary" onClick={() => void runRegenerate()} loading={regenerating}>Regenerate secret</Button>
                </div>
            </Modal>
        </div>
    );
}
