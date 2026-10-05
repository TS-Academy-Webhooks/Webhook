import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Pagination } from "../../components/common/Pagination";
import { Loader } from "../../components/common/Loader";
import { EmptyState } from "../../components/common/EmptyState";
import { getShipments } from "../../services/shipmentService";
import { SHIPMENT_STATUSES, formatShipmentStatus } from "../../constants/shipmentStatuses";
import { formatDate } from "../../utils/formatDate";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import "./Shipments.css";

function formatAmount(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount);
}

export default function Shipments() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const requestedStatus = searchParams.get("status") || "";
    const status = SHIPMENT_STATUSES.includes(requestedStatus) ? requestedStatus : "";
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
        getShipments({ page, limit: 10, status, search })
            .then((data) => alive && setResult(data))
            .catch((requestError) => alive && setError(requestError.message))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [page, status, search]);

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
                    <h1>Shipments</h1>
                    <p className="feature-page__muted">Review shipment status, route, and tracking history.</p>
                </div>
                <Link className="feature-page__action-link" to="/shipments/new">＋ New shipment</Link>
            </header>

            <div className="feature-page__toolbar shipment-toolbar">
                <label>
                    <span className="sr-only">Search shipments</span>
                    <input
                        type="search"
                        name="search"
                        maxLength={100}
                        autoComplete="off"
                        placeholder="Search tracking or route…"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </label>
                <label>
                    <span className="sr-only">Filter shipments by status</span>
                    <select value={status} onChange={(event) => updateQuery("status", event.target.value)}>
                        <option value="">All statuses</option>
                        {SHIPMENT_STATUSES.map((item) => (
                            <option value={item} key={item}>{formatShipmentStatus(item)}</option>
                        ))}
                    </select>
                </label>
            </div>

            {error && <p role="alert" className="feature-page__error">{error}</p>}
            {loading ? <Loader label="Loading shipments" showLabel /> : result?.items.length ? (
                <>
                    <div className="feature-page__table shipment-table">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Tracking number</th>
                                    {user?.role === "admin" && <th scope="col">Customer</th>}
                                    <th scope="col">Status</th>
                                    <th scope="col">Origin</th>
                                    <th scope="col">Destination</th>
                                    <th scope="col">Amount</th>
                                    <th scope="col">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.items.map((shipment) => (
                                    <tr key={shipment.id}>
                                        <td><Link to={`/shipments/${encodeURIComponent(shipment.id)}`}>{shipment.trackingNumber}</Link></td>
                                        {user?.role === "admin" && <td>{shipment.customer ?? "Unassigned"}</td>}
                                        <td><span className={`shipment-status shipment-status--${shipment.status}`}>{formatShipmentStatus(shipment.status)}</span></td>
                                        <td>{shipment.origin}</td>
                                        <td>{shipment.destination}</td>
                                        <td>{formatAmount(shipment.amount)}</td>
                                        <td>{formatDate(shipment.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={result.pagination} onPageChange={(nextPage) => updateQuery("page", String(nextPage))} />
                </>
            ) : (
                <EmptyState
                    title={search || status ? "No shipments match these filters" : "No shipments yet"}
                    description={search || status ? "Adjust your search or status filter and try again." : "Create a shipment to start tracking its progress."}
                    action={!search && !status ? <Link to="/shipments/new">Create a shipment</Link> : undefined}
                />
            )}
        </section>
    );
}
