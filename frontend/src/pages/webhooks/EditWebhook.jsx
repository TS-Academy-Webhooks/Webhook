// src/pages/webhooks/EditWebhook.jsx
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useWebhook } from '../../hooks/useWebhook.js';
import { WebhookForm } from '../../components/webhooks/WebhookForm.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ROUTES } from '../../constants/routes.js';
import './EditWebhook.css';

// Only send fields that actually changed; the service maps UI fields to the
// backend's PATCH contract.
function diffPayload(original, next) {
    const diff = {};
    if (next.name !== original.name) diff.name = next.name;
    if (next.url !== original.url) diff.url = next.url;
    if ((next.description ?? '') !== (original.description ?? '')) diff.description = next.description;
    if (next.isActive !== original.isActive) diff.isActive = next.isActive;

    const sameEvents =
        original.events.length === next.events.length &&
        original.events.every((event) => next.events.includes(event));
    if (!sameEvents) diff.events = next.events;

    return diff;
}

export default function EditWebhook() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { webhook, loading, error, notFound, refetch, update } = useWebhook(id);

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
            <div className="edit-webhook-page__error" role="alert">
                <p>{error}</p>
                <Button variant="ghost" onClick={refetch}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!webhook) return null;

    const handleSubmit = async (payload) => {
        const changed = diffPayload(webhook, payload);
        if (Object.keys(changed).length > 0) {
            await update(changed);
        }
        navigate(ROUTES.WEBHOOK_DETAILS(id));
    };

    return (
        <div className="edit-webhook-page">
            <div className="edit-webhook-page__header">
                <h1>Edit Webhook</h1>
                <p>Update the endpoint or event subscriptions for {webhook.name}.</p>
            </div>

            <WebhookForm
                initialValues={{ name: webhook.name, url: webhook.url, description: webhook.description, isActive: webhook.isActive, events: webhook.events }}
                onSubmit={handleSubmit}
                onCancel={() => navigate(ROUTES.WEBHOOK_DETAILS(id))}
                submitLabel="Save changes"
            />
        </div>
    );
}
