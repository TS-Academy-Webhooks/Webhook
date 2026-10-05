import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvent } from "../services/eventService";
import { getDeliveries, resendDelivery } from "../services/deliveryService";
import { formatDate } from "../utils/formatDate";
import { formatEventType } from "../utils/formatEventType";
import { Loader } from "../components/common/Loader";
import { Badge } from "../components/common/Badge";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

function statusVariant(status) {
    if (status === "success") return "success";
    if (status === "failed") return "destructive";
    return "neutral";
}

export default function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deliveryError, setDeliveryError] = useState("");
    const [busy, setBusy] = useState("");
    const [notice, setNotice] = useState("");
    const [copied, copy] = useCopyToClipboard();

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        setDeliveryError("");
        try {
            const nextEvent = await getEvent(id);
            setEvent(nextEvent);
            try {
                const page = await getDeliveries({ eventId: nextEvent.id, page: 1, limit: 100 });
                setDeliveries(page.items);
            } catch (requestError) {
                setDeliveryError(requestError.message);
            }
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    async function resend(deliveryId) {
        setBusy(deliveryId);
        setNotice("");
        try {
            await resendDelivery(deliveryId);
            setNotice("A new delivery attempt was queued.");
            const page = await getDeliveries({ eventId: event.id, page: 1, limit: 100 });
            setDeliveries(page.items);
        } catch (requestError) {
            setNotice(requestError.message);
        } finally {
            setBusy("");
        }
    }

    if (loading) return <Loader label="Loading event" showLabel />;
    if (error || !event) {
        return (
            <section className="feature-page">
                <p className="feature-page__error" role="alert">{error || "Event not found."}</p>
                <Link to="/events">Back to events</Link>
            </section>
        );
    }

    const payload = event.payload ?? event.data ?? {};
    const payloadText = JSON.stringify(payload, null, 2);
    const shipmentId = event.shipment?.id ?? event.shipment?._id ?? event.shipment;
    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <p><Link to="/events">Shipment events</Link></p>
                    <h1>{formatEventType(event.type)}</h1>
                    <p className="feature-page__muted">{event.eventId}</p>
                </div>
                <div className="feature-page__form-actions">
                    <button type="button" onClick={() => copy(payloadText)}>{copied ? "Copied payload" : "Copy payload"}</button>
                    <button type="button" onClick={() => copy(event.eventId ?? event.id)}>Copy event ID</button>
                </div>
            </header>
            {copied && <span className="sr-only" role="status" aria-live="polite">Copied to clipboard.</span>}

            <section className="feature-page__panel">
                <h2>Event details</h2>
                <dl className="feature-page__definition">
                    <div><dt>Event ID</dt><dd>{event.eventId ?? event.id}</dd></div>
                    <div><dt>Type</dt><dd>{event.type}</dd></div>
                    <div><dt>Created</dt><dd>{formatDate(event.createdAt, { withTime: true })}</dd></div>
                    <div><dt>Shipment</dt><dd>{event.shipment?.trackingNumber ?? shipmentId ?? "—"}</dd></div>
                </dl>
            </section>

            <section className="feature-page__panel">
                <h2>Payload</h2>
                <pre className="feature-page__code">{payloadText}</pre>
            </section>

            <section className="feature-page__panel">
                <h2>Delivery summaries</h2>
                {notice && <p role="status" aria-live="polite">{notice}</p>}
                {deliveryError && <p role="alert" className="feature-page__error">{deliveryError}</p>}
                {deliveries.length ? (
                    <div className="feature-page__table">
                        <table>
                            <thead><tr><th scope="col">Endpoint</th><th scope="col">Status</th><th scope="col">Attempts</th><th scope="col">HTTP</th><th scope="col">Last attempt</th><th scope="col">Action</th></tr></thead>
                            <tbody>
                                {deliveries.map((delivery) => (
                                    <tr key={delivery.id}>
                                        <td><Link to={`/deliveries/${encodeURIComponent(delivery.id)}`}>{delivery.webhook?.name ?? delivery.webhook?.url ?? "Endpoint"}</Link></td>
                                        <td><Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge></td>
                                        <td>{delivery.attemptCount}</td>
                                        <td>{delivery.httpStatus ?? "—"}</td>
                                        <td>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</td>
                                        <td>{delivery.status === "failed" && (
                                            <button type="button" disabled={busy === delivery.id} onClick={() => void resend(delivery.id)}>
                                                {busy === delivery.id ? "Resending…" : "Resend"}
                                            </button>
                                        )}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : !deliveryError ? <p className="feature-page__muted">No delivery summaries are associated with this event.</p> : null}
            </section>
        </section>
    );
}
