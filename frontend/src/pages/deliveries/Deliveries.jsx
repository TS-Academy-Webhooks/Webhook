import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pagination } from "../../components/common/Pagination";
import { Loader } from "../../components/common/Loader";
import { EmptyState } from "../../components/common/EmptyState";
import { getDeliveries } from "../../services/deliveryService";
import { formatDate } from "../../utils/formatDate";
import { formatEventType } from "../../utils/formatEventType";
import { Badge } from "../../components/common/Badge";
import { useAuth } from "../../hooks/useAuth";

const DELIVERY_STATUSES = ["pending", "success", "failed"];

function statusVariant(status) {
    if (status === "success") return "success";
    if (status === "failed") return "destructive";
    return "neutral";
}

function relatedId(resource) {
    return resource?.id ?? resource?._id ?? (typeof resource === "string" ? resource : null);
}

export default function Deliveries() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const rawStatus = searchParams.get("status") || "";
    const status = DELIVERY_STATUSES.includes(rawStatus) ? rawStatus : "";
    const webhookId = searchParams.get("webhookId") || "";
    const eventId = searchParams.get("eventId") || "";
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        getDeliveries({
            page,
            limit: 20,
            status: DELIVERY_STATUSES.includes(status) ? status : undefined,
            webhookId: webhookId || undefined,
            eventId: eventId || undefined,
        })
            .then((data) => alive && setResult(data))
            .catch((requestError) => alive && setError(requestError.message))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [eventId, page, status, webhookId]);

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
                    <h1>Deliveries</h1>
                    <p className="feature-page__muted">Review delivery summaries, latest results, and individual attempts.</p>
                </div>
                {(webhookId || eventId) && (
                    <button type="button" onClick={() => setSearchParams({})}>Clear linked filter</button>
                )}
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
            {loading ? <Loader label="Loading deliveries" showLabel /> : result?.items.length ? (
                <>
                    <div className="feature-page__table">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Delivery</th>
                                    <th scope="col">Event</th>
                                    <th scope="col">Webhook</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Attempts</th>
                                    <th scope="col">HTTP</th>
                                    <th scope="col">Last attempt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.items.map((delivery) => {
                                    const eventIdValue = relatedId(delivery.event);
                                    const eventLabel = delivery.event?.eventId
                                        ?? delivery.event?.type
                                        ?? (typeof delivery.event === "string" ? delivery.event : "—");
                                    const webhookIdValue = relatedId(delivery.webhook);
                                    return (
                                        <tr key={delivery.id}>
                                            <td><Link to={`/deliveries/${encodeURIComponent(delivery.id)}`}>{delivery.id}</Link></td>
                                            <td>{eventIdValue && user?.role === "admin"
                                                ? <Link to={`/events/${encodeURIComponent(eventIdValue)}`}>{delivery.event?.eventId ?? formatEventType(delivery.event?.type ?? "Event")}</Link>
                                                : (delivery.event?.type ? formatEventType(eventLabel) : eventLabel)}</td>
                                            <td>
                                                {webhookIdValue
                                                    ? <Link to={`/webhooks/${encodeURIComponent(webhookIdValue)}`}>{delivery.webhook?.name ?? delivery.webhook?.url ?? webhookIdValue}</Link>
                                                    : delivery.webhook?.name ?? "—"}
                                            </td>
                                            <td><Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge></td>
                                            <td>{delivery.attemptCount}</td>
                                            <td>{delivery.httpStatus ?? "—"}</td>
                                            <td>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={result.pagination} onPageChange={(nextPage) => updateQuery("page", String(nextPage))} />
                </>
            ) : (
                <EmptyState
                    title={status || webhookId || eventId ? "No deliveries match these filters" : "No deliveries yet"}
                    description="A delivery summary appears when a subscribed webhook receives an event."
                />
            )}
        </section>
    );
}
