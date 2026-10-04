import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "../../components/common/Loader";
import { formatDate } from "../../utils/formatDate";
import { getDelivery, resendDelivery } from "../../services/deliveryService";

export default function DeliveryDetails() {
    const { id } = useParams();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retrying, setRetrying] = useState(false);
    const [message, setMessage] = useState("");

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

    useEffect(() => {
        load();
    }, [load]);

    async function retry() {
        setRetrying(true);
        setMessage("");
        try {
            await resendDelivery(id);
            setMessage("Retry request submitted as a new delivery attempt.");
        } catch (requestError) {
            setMessage(requestError.message);
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

    const eventId = delivery.event?.id ?? delivery.event?._id;
    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <p><Link to="/deliveries">Delivery attempts</Link></p>
                    <h1>Delivery details</h1>
                </div>
                {delivery.status === "failed" && (
                    <button type="button" disabled={retrying} onClick={retry}>
                        {retrying ? "Retrying…" : "Retry delivery"}
                    </button>
                )}
            </header>
            {message && <p role="status">{message}</p>}
            <section className="feature-page__panel">
                <dl className="feature-page__definition">
                    <div><dt>Delivery ID</dt><dd>{delivery.id}</dd></div>
                    <div><dt>Status</dt><dd>{delivery.status}</dd></div>
                    <div><dt>Attempt</dt><dd>{delivery.attemptNumber ?? "—"}</dd></div>
                    <div><dt>HTTP response</dt><dd>{delivery.httpStatus ?? "—"}</dd></div>
                    <div><dt>Response time</dt><dd>{delivery.duration != null ? `${delivery.duration} ms` : "—"}</dd></div>
                    <div><dt>Attempted</dt><dd>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</dd></div>
                    <div><dt>Endpoint</dt><dd>{delivery.webhook?.name ?? delivery.webhook?.url ?? "—"}</dd></div>
                    <div>
                        <dt>Event</dt>
                        <dd>
                            {eventId ? (
                                <Link to={`/events/${eventId}`}>
                                    {delivery.event?.eventId ?? delivery.event?.type ?? eventId}
                                </Link>
                            ) : "—"}
                        </dd>
                    </div>
                </dl>
            </section>
            {delivery.event?.payload && (
                <section className="feature-page__panel">
                    <h2>Event payload</h2>
                    <pre className="feature-page__code">
                        {JSON.stringify(delivery.event.payload, null, 2)}
                    </pre>
                </section>
            )}
            {delivery.response && (
                <section className="feature-page__panel">
                    <h2>HTTP response</h2>
                    <pre className="feature-page__code">{delivery.response}</pre>
                </section>
            )}
        </section>
    );
}
