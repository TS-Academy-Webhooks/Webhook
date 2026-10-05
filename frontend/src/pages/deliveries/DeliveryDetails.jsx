import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "../../components/common/Loader";
import { Badge } from "../../components/common/Badge";
import { formatDate } from "../../utils/formatDate";
import { formatEventType } from "../../utils/formatEventType";
import { getDelivery, resendDelivery } from "../../services/deliveryService";
import { useAuth } from "../../hooks/useAuth";

function statusVariant(status) {
    if (status === "success") return "success";
    if (status === "failed") return "destructive";
    return "neutral";
}

function relatedId(resource) {
    return resource?.id ?? resource?._id ?? (typeof resource === "string" ? resource : null);
}

export default function DeliveryDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retrying, setRetrying] = useState(false);
    const [notice, setNotice] = useState("");
    const [noticeIsError, setNoticeIsError] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setDelivery(await getDelivery(id));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    async function resend() {
        setRetrying(true);
        setNotice("");
        setNoticeIsError(false);
        try {
            await resendDelivery(delivery.id);
            setNotice("A new delivery attempt was queued.");
            await load();
        } catch (requestError) {
            setNotice(requestError.message);
            setNoticeIsError(true);
        } finally {
            setRetrying(false);
        }
    }

    if (loading) return <Loader label="Loading delivery" showLabel />;
    if (error || !delivery) {
        return (
            <section className="feature-page">
                <p role="alert" className="feature-page__error">{error || "Delivery not found."}</p>
                <Link to="/deliveries">Back to deliveries</Link>
            </section>
        );
    }

    const eventId = relatedId(delivery.event);
    const webhookId = relatedId(delivery.webhook);
    const event = delivery.event && typeof delivery.event === "object" ? delivery.event : null;
    const attempts = delivery.attempts ?? [];
    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <p><Link to="/deliveries">Deliveries</Link></p>
                    <h1>Delivery details</h1>
                    <p className="feature-page__muted">{delivery.id}</p>
                </div>
                {delivery.status === "failed" && (
                    <button type="button" disabled={retrying} onClick={() => void resend()}>
                        {retrying ? "Queueing…" : "Resend failed delivery"}
                    </button>
                )}
            </header>

            {notice && <p className={noticeIsError ? "feature-page__error" : "feature-page__notice"} role={noticeIsError ? "alert" : "status"} aria-live={noticeIsError ? undefined : "polite"}>{notice}</p>}

            <section className="feature-page__panel">
                <h2>Delivery summary</h2>
                <dl className="feature-page__definition">
                    <div><dt>Status</dt><dd><Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge></dd></div>
                    <div><dt>Attempts</dt><dd>{delivery.attemptCount}</dd></div>
                    <div><dt>Last HTTP status</dt><dd>{delivery.httpStatus ?? "—"}</dd></div>
                    <div><dt>Last response time</dt><dd>{delivery.duration != null ? `${delivery.duration} ms` : "—"}</dd></div>
                    <div><dt>Last attempted</dt><dd>{formatDate(delivery.attemptedAt ?? delivery.updatedAt ?? delivery.createdAt, { withTime: true })}</dd></div>
                    <div><dt>Webhook</dt><dd>{webhookId ? <Link to={`/webhooks/${encodeURIComponent(webhookId)}`}>{delivery.webhook?.name ?? delivery.webhook?.url ?? webhookId}</Link> : "—"}</dd></div>
                    <div><dt>Event</dt><dd>{eventId && user?.role === "admin"
                        ? <Link to={`/events/${encodeURIComponent(eventId)}`}>{event?.eventId ?? formatEventType(event?.type ?? "Event")}</Link>
                        : event?.eventId ?? (event?.type ? formatEventType(event.type) : eventId ?? "—")}</dd></div>
                </dl>
            </section>

            <section className="feature-page__panel">
                <h2>Attempt history</h2>
                {attempts.length ? (
                    <div className="webhook-attempts">
                        {attempts.map((attempt) => (
                            <article className="webhook-attempt" key={attempt.id ?? attempt.attemptNumber}>
                                <header className="webhook-attempt__head">
                                    <strong>Attempt {attempt.attemptNumber ?? "—"}</strong>
                                    <Badge variant={statusVariant(attempt.status)}>{attempt.status}</Badge>
                                </header>
                                <dl className="feature-page__definition">
                                    <div><dt>HTTP status</dt><dd>{attempt.httpStatus ?? "—"}</dd></div>
                                    <div><dt>Duration</dt><dd>{attempt.duration != null ? `${attempt.duration} ms` : "—"}</dd></div>
                                    <div><dt>Attempted</dt><dd>{formatDate(attempt.attemptedAt, { withTime: true })}</dd></div>
                                    <div><dt>Error</dt><dd>{attempt.error || "—"}</dd></div>
                                </dl>
                                {attempt.response && <details><summary>Response body</summary><pre className="feature-page__code">{attempt.response}</pre></details>}
                            </article>
                        ))}
                    </div>
                ) : <p className="feature-page__muted">No attempt history is available for this delivery summary.</p>}
            </section>

            {event?.payload && (
                <section className="feature-page__panel">
                    <h2>Event payload</h2>
                    <pre className="feature-page__code">{JSON.stringify(event.payload, null, 2)}</pre>
                </section>
            )}
        </section>
    );
}
