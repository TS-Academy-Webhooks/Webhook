import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getEvents } from "../services/eventService";
import { SHIPMENT_EVENT_VALUES } from "../constants/webhookEvents";
import { formatDate } from "../utils/formatDate";
import { formatEventType } from "../utils/formatEventType";
import { Pagination } from "../components/common/Pagination";
import { Loader } from "../components/common/Loader";
import { EmptyState } from "../components/common/EmptyState";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const EVENT_FILTERS = [...SHIPMENT_EVENT_VALUES, "webhook.test"];

export default function Events() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const requestedType = searchParams.get("type") || "";
    const type = EVENT_FILTERS.includes(requestedType) ? requestedType : "";
    const search = searchParams.get("search") || "";
    const [searchInput, setSearchInput] = useState(search);
    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => setSearchInput(search), [search]);

    useEffect(() => {
        if (debouncedSearch === search) return;
        const next = new URLSearchParams(searchParams);
        if (debouncedSearch.trim()) next.set("search", debouncedSearch.trim());
        else next.delete("search");
        next.delete("page");
        setSearchParams(next, { replace: true });
    }, [debouncedSearch, search, searchParams, setSearchParams]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        getEvents({ page, limit: 20, type, search })
            .then((data) => alive && setResult(data))
            .catch((requestError) => alive && setError(requestError.message))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [page, search, type]);

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
                    <h1>Shipment events</h1>
                    <p className="feature-page__muted">Inspect recorded shipment changes and test events.</p>
                </div>
            </header>
            <div className="feature-page__toolbar">
                <label>
                    <span className="sr-only">Search event ID</span>
                    <input
                        type="search"
                        name="search"
                        autoComplete="off"
                        maxLength={100}
                        placeholder="Search event ID…"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </label>
                <label>
                    <span className="sr-only">Filter by event type</span>
                    <select value={type} onChange={(event) => updateQuery("type", event.target.value)}>
                        <option value="">All event types</option>
                        {EVENT_FILTERS.map((eventType) => (
                            <option value={eventType} key={eventType}>{formatEventType(eventType)}</option>
                        ))}
                    </select>
                </label>
            </div>
            {error && <p className="feature-page__error" role="alert">{error}</p>}
            {loading ? <Loader label="Loading events" showLabel /> : result?.items.length ? (
                <>
                    <div className="feature-page__table">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Event ID</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Shipment</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.items.map((event) => {
                                    const shipment = event.shipment;
                                    const shipmentId = shipment?.id ?? shipment?._id ?? shipment;
                                    return (
                                        <tr key={event.id}>
                                            <td><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.eventId}</Link></td>
                                            <td>{formatEventType(event.type)}</td>
                                            <td>{shipment?.trackingNumber ?? shipmentId ?? "—"}</td>
                                            <td>{event.payload?.status ?? event.data?.status ?? "—"}</td>
                                            <td>{formatDate(event.createdAt, { withTime: true })}</td>
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
                    title={search || type ? "No events match these filters" : "No events yet"}
                    description="Events are recorded as shipment statuses change or when a test webhook is queued."
                />
            )}
        </section>
    );
}
