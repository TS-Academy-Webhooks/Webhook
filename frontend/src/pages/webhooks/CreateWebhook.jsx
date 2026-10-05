// src/pages/webhooks/CreateWebhook.jsx
import { useNavigate } from 'react-router-dom';
import { WebhookForm } from '../../components/webhooks/WebhookForm';
import { createWebhook } from '../../services/webhookService';
import { ROUTES } from '../../constants/routes';
import './CreateWebhook.css';

export default function CreateWebhook() {
    const navigate = useNavigate();

    const handleSubmit = async (payload) => {
        const created = await createWebhook(payload);
// The full secret only ever comes back on create. Pass it via router
// state — never the URL or localStorage — so Details can show it once.
        navigate(ROUTES.WEBHOOK_DETAILS(created.id), {
            state: { newSecret: created.secret },
        });
    };

    return (
        <div className="create-webhook-page">
            <div className="create-webhook-page__header">
                <h1>Create Webhook</h1>
                <p>
                    Register an endpoint to receive supported shipment events. Your signing secret is shown once after creation, so store it securely.
                </p>
            </div>

            <WebhookForm onSubmit={handleSubmit} onCancel={() => navigate(ROUTES.WEBHOOK_ENDPOINTS)} />
        </div>
    );
}
