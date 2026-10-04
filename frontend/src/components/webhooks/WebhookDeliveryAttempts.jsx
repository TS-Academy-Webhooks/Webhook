import { formatDate } from '../../utils/formatDate';
import { WebhookStatusBadge } from './WebhookStatusBadge';

export function WebhookDeliveryAttempts({ attempts = [] }) {
    return <section className="feature-page__panel"><h2>Delivery attempts</h2>{attempts.length ? <div className="webhook-attempts">{attempts.map((attempt, index) => <article className="webhook-attempt" key={attempt.id ?? attempt._id ?? attempt.attemptNumber ?? index}><div className="webhook-attempt__head"><strong>Attempt {attempt.attemptNumber ?? index + 1}</strong><WebhookStatusBadge status={attempt.status} /></div><dl className="feature-page__definition"><div><dt>HTTP status</dt><dd>{attempt.httpStatus ?? '—'}</dd></div><div><dt>Response time</dt><dd>{attempt.responseTime != null ? `${attempt.responseTime} ms` : attempt.duration != null ? `${attempt.duration} ms` : '—'}</dd></div><div><dt>Time</dt><dd>{formatDate(attempt.attemptedAt ?? attempt.createdAt, { withTime: true })}</dd></div><div><dt>Response</dt><dd>{attempt.response ?? '—'}</dd></div></dl></article>)}</div> : <p className="feature-page__muted">No delivery attempts have been recorded yet.</p>}</section>;
}
