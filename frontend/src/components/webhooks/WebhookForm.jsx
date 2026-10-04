// src/components/webhooks/WebhookForm.jsx
import { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { EventSelector } from './EventSelector';
import { validateWebhook, isValid } from '../../utils/validateWebhook';
import './WebhookForm.css';

const DEMO_RECEIVER_URL = `${
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
}/demo-receiver`;

/**
 * @param {{ name: string, url: string, events: string[] }} [initialValues]
 * @param {(payload: { name: string, url: string, events: string[] }) => Promise<any>} onSubmit
 * @param {() => void} [onCancel]
 * @param {string} [submitLabel]
 */
export function WebhookForm({
                                initialValues = { name: '', url: '', description: '', events: [], isActive: true },
                                onSubmit,
                                onCancel,
                                submitLabel = 'Create Webhook',
                            }) {
    const [name, setName] = useState(initialValues.name);
    const [url, setUrl] = useState(initialValues.url);
    const [description, setDescription] = useState(initialValues.description ?? '');
    const [events, setEvents] = useState(initialValues.events);
    const [isActive, setIsActive] = useState(initialValues.isActive ?? true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleUseDemoReceiver = () => {
        setUrl(DEMO_RECEIVER_URL);
        setFieldErrors((prev) => ({ ...prev, url: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const clientErrors = validateWebhook({ name, url, events });
        if (!isValid(clientErrors)) {
            setFieldErrors(clientErrors);
            return;
        }

        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);
        try {
            await onSubmit({ name: name.trim(), url: url.trim(), description: description.trim(), events, isActive });
        } catch (err) {
            // err is expected to be the normalized shape from utils/apiError.js:
            // { message, fieldErrors }
            if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
                setFieldErrors(err.fieldErrors);
            } else {
                setFormError(err?.message || 'Unable to save webhook. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="webhook-form" onSubmit={handleSubmit} noValidate>
            {formError && (
                <p className="webhook-form__error" role="alert">
                    {formError}
                </p>
            )}

            <Input
                label="Webhook name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                placeholder="e.g. Logistics Customer App"
            />

            <div className="webhook-form__url-field">
                <Input
                    label="Endpoint URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    error={fieldErrors.url}
                    placeholder="https://example.com/webhooks/receive"
                />
                <button
                    type="button"
                    className="webhook-form__demo-link"
                    onClick={handleUseDemoReceiver}
                >
                    Use Demo Receiver
                </button>
            </div>

            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this endpoint is used for" />

            <EventSelector selected={events} onChange={setEvents} error={fieldErrors.events} />

            <label className="webhook-form__active"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Endpoint active</label>

            <div className="webhook-form__actions">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="primary" loading={submitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
