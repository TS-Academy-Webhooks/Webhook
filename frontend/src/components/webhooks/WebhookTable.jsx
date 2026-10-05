// src/components/webhooks/WebhookTable.jsx
import { Link } from 'react-router-dom';
import { EventBadges } from './EventBadges';
import { WebhookStatus } from './WebhookStatus';
import { formatDate } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import './WebhookTable.css';

// ASSUMPTION: utils/formatDate exports a default-ish named `formatDate(dateString)`.
// Adjust the import if your actual signature differs.

/**
 * @param {object[]} webhooks
 * @param {string|null} pendingId - id of the row whose toggle is mid-request
 * @param {(id: string, next: boolean) => void} onToggle
 * @param {(webhook: object) => void} onDeleteRequest - opens the confirm modal
 */
export function WebhookTable({ webhooks, pendingId, onToggle, onDeleteRequest }) {
    return (
        <>
            {/* Desktop table */}
            <div className="webhook-table__scroll">
                <table className="webhook-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>URL</th>
                        <th>Events</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th aria-label="Actions" />
                    </tr>
                    </thead>
                    <tbody>
                    {webhooks.map((webhook) => (
                        <tr key={webhook.id}>
                            <td>
                                <Link to={ROUTES.WEBHOOK_DETAILS(webhook.id)} className="webhook-table__name-link">
                                    {webhook.name}
                                </Link>
                            </td>
                            <td className="webhook-table__url" title={webhook.url}>
                                {webhook.url}
                            </td>
                            <td>
                                <EventBadges events={webhook.events} />
                            </td>
                            <td>
                                <WebhookStatus
                                    isActive={webhook.isActive}
                                    webhookName={webhook.name}
                                    pending={pendingId === webhook.id}
                                    onToggle={(next) => onToggle(webhook.id, next)}
                                />
                            </td>
                            <td>{formatDate(webhook.createdAt)}</td>
                            <td className="webhook-table__actions">
                                <Link to={ROUTES.WEBHOOK_DETAILS(webhook.id)}>View</Link>
                                <Link to={ROUTES.WEBHOOK_EDIT(webhook.id)}>Edit</Link>
                                <button type="button" onClick={() => onDeleteRequest(webhook)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile stacked cards — same data, no horizontal scroll */}
            <div className="webhook-cards">
                {webhooks.map((webhook) => (
                    <div key={webhook.id} className="webhook-card">
                        <div className="webhook-card__header">
                            <Link to={ROUTES.WEBHOOK_DETAILS(webhook.id)} className="webhook-table__name-link">
                                {webhook.name}
                            </Link>
                            <WebhookStatus
                                isActive={webhook.isActive}
                                webhookName={webhook.name}
                                pending={pendingId === webhook.id}
                                onToggle={(next) => onToggle(webhook.id, next)}
                            />
                        </div>
                        <p className="webhook-card__url" title={webhook.url}>
                            {webhook.url}
                        </p>
                        <EventBadges events={webhook.events} />
                        <div className="webhook-card__footer">
                            <span className="webhook-card__date">{formatDate(webhook.createdAt)}</span>
                            <div className="webhook-table__actions">
                                <Link to={ROUTES.WEBHOOK_DETAILS(webhook.id)}>View</Link>
                                <Link to={ROUTES.WEBHOOK_EDIT(webhook.id)}>Edit</Link>
                                <button type="button" onClick={() => onDeleteRequest(webhook)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}