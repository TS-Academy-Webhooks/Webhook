// src/components/webhooks/DeleteWebhookModal.jsx
import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import './DeleteWebhookModal.css';

// ASSUMPTION: Modal takes `isOpen`, `onClose`, `title`, and renders
// `children` inside its body. Adjust prop names if yours differ.

/**
 * @param {object|null} webhook - the webhook pending deletion, or null when closed
 * @param {() => void} onClose
 * @param {(id: string) => Promise<void>} onConfirm
 */
export function DeleteWebhookModal({ webhook, onClose, onConfirm }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);

    if (!webhook) return null;

    const handleConfirm = async () => {
        setDeleting(true);
        setError(null);
        try {
            await onConfirm(webhook.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Unable to delete webhook. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal isOpen={Boolean(webhook)} onClose={onClose} title="Delete webhook">
            <p>
                Are you sure you want to delete <strong>{webhook.name}</strong>? This
                cannot be undone, and any external app relying on it will stop
                receiving events immediately.
            </p>

            {error && (
                <p role="alert" className="delete-webhook-modal__error">
                    {error}
                </p>
            )}

            <div className="delete-webhook-modal__actions">
                <Button variant="ghost" onClick={onClose} disabled={deleting}>
                    Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirm} loading={deleting}>
                    Delete webhook
                </Button>
            </div>
        </Modal>
    );
}