import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { getWebhookDeliveries } from "../../services/webhookService";
import { Pagination } from "../../components/common/Pagination";
import { Loader } from "../../components/common/Loader";
import { EmptyState } from "../../components/common/EmptyState";
import { Badge } from "../../components/common/Badge";
import { formatDate } from "../../utils/formatDate";
import { formatEventType } from "../../utils/formatEventType";

const DELIVERY_STATUSES = ["pending", "success", "failed"];

function statusVariant(status) {
    if (status === "success") return "success";
    if (status === "failed") return "destructive";
    return "neutral";
}

export default function DeliveryHistory() {
    const { webhookId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const requestedStatus = searchParams.get("status") || "";
    const status = DELIVERY_STATUSES.includes(requestedStatus) ? requestedStatus : "";
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        getWebhookDeliveries(webhookId, {
            page,
            limit: 20,
            status: DELIVERY_STATUSES.includes(status) ? status : undefined,
        })
            .then((data) => alive && setResult(data))
            .catch((requestError) => alive && setError(requestError.message))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [page, status, webhookId]);

    function updateQuery(key, value) {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        setSearchParams(next);
    }

    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <p><Link to={`/webhooks/${encodeURIComponent(webhookId)}`}>Webhook details</Link></p>
                    <h1>Delivery history</h1>
                    <p className="feature-page__muted">Delivery summaries for webhook <code>{webhookId}</code>.</p>
                </div>
                <Link to="/deliveries">All deliveries</Link>
            </header>
            <div className="feature-page__toolbar">
                <label>
                    <span className="sr-only">Filter delivery status</span>
                    <select value={status} onChange={(event) => updateQuery("status", event.target.value)}>
                        <option value="">All statuses</option>
                        {DELIVERY_STATUSES.map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                    </select>
                </label>
            </div>
            {error && <p role="alert" className="feature-page__error">{error}</p>}
            {loading ? <Loader label="Loading delivery history" showLabel /> : result?.items.length ? (
                <>
                    <div className="feature-page__table">
                        <table>
                            <thead><tr><th scope="col">Delivery</th><th scope="col">Event</th><th scope="col">Status</th><th scope="col">Attempts</th><th scope="col">HTTP</th><th scope="col">Last attempt</th></tr></thead>
                            <tbody>
                                {result.items.map((delivery) => (
                                    <tr key={delivery.id}>
                                        <td><Link to={`/deliveries/${encodeURIComponent(delivery.id)}`}>{delivery.id}</Link></td>
                                        <td>{delivery.event?.eventId ?? formatEventType(delivery.event?.type ?? "Event")}</td>
                                        <td><Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge></td>
                                        <td>{delivery.attemptCount}</td>
                                        <td>{delivery.httpStatus ?? "—"}</td>
                                        <td>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={result.pagination} onPageChange={(nextPage) => updateQuery("page", String(nextPage))} />
                </>
            ) : (
                <EmptyState title={status ? "No deliveries match this filter" : "No delivery summaries yet"} description="Matching shipment events will appear here after they are sent to this webhook." />
            )}
        </section>
    );
}
