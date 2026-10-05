// src/components/webhooks/WebhookForm.jsx
import { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { EventSelector } from './EventSelector';
import { validateWebhook, isValid } from '../../utils/validateWebhook';
import './WebhookForm.css';

function getDemoReceiverUrl() {
    if (import.meta.env.DEV) return 'http://localhost:3000/api/demo-receiver';
    if (typeof window !== 'undefined') {
        return new URL('/api/demo-receiver', window.location.origin).href;
    }
    return 'https://example.com/api/demo-receiver';
}

/**
 * @param {{ name: string, url: string, events: string[] }} [initialValues]
 * @param {(payload: { name: string, url: string, events: string[] }) => Promise<any>} onSubmit
 * @param {() => void} [onCancel]
 * @param {string} [submitLabel]
 */
export function WebhookForm({
                                initialValues = { name: '', url: '', events: [], isActive: true },
                                onSubmit,
                                onCancel,
                                submitLabel = 'Create Webhook',
                            }) {
    const [name, setName] = useState(initialValues.name);
    const [url, setUrl] = useState(initialValues.url);
    const [events, setEvents] = useState(initialValues.events);
    const [isActive, setIsActive] = useState(initialValues.isActive ?? true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    function focusFirstError(errors) {
        const firstField = Object.keys(errors)[0];
        const fieldId = firstField === 'events' ? 'webhook-events' : `webhook-${firstField}`;
        document.getElementById(fieldId)?.focus();
    }

    const handleUseDemoReceiver = () => {
        setUrl(getDemoReceiverUrl());
        setFieldErrors((prev) => ({ ...prev, url: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const clientErrors = validateWebhook({ name, url, events });
        if (!isValid(clientErrors)) {
            setFieldErrors(clientErrors);
            focusFirstError(clientErrors);
            return;
        }

        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);
        try {
            await onSubmit({ name: name.trim(), url: url.trim(), events, isActive });
        } catch (err) {
            // err is expected to be the normalized shape from utils/apiError.js:
            // { message, fieldErrors }
            if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
                setFieldErrors(err.fieldErrors);
                focusFirstError(err.fieldErrors);
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
                id="webhook-name"
                label="Webhook name"
                name="name"
                autoComplete="off"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((current) => ({ ...current, name: undefined }));
                }}
                error={fieldErrors.name}
                minLength={2}
                maxLength={80}
                placeholder="e.g., Logistics Customer App…"
            />

            <div className="webhook-form__url-field">
                <Input
                    id="webhook-url"
                    label="Endpoint URL"
                    name="url"
                    type="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setFieldErrors((current) => ({ ...current, url: undefined }));
                    }}
                    error={fieldErrors.url}
                    placeholder="https://example.com/webhooks/receive…"
                />
                <button
                    type="button"
                    className="webhook-form__demo-link"
                    onClick={handleUseDemoReceiver}
                >
                    Use Demo Receiver
                </button>
                <p className="webhook-form__hint">
                    Production URLs must use HTTPS. Localhost webhooks require the backend demo receiver and localhost flags to be enabled.
                </p>
            </div>

            <EventSelector
                selected={events}
                onChange={(next) => {
                    setEvents(next);
                    setFieldErrors((current) => ({ ...current, events: undefined }));
                }}
                error={fieldErrors.events}
            />

            <label className="webhook-form__active"><input type="checkbox" name="active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Endpoint active</label>

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
