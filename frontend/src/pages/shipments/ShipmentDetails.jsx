import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Loader } from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import {
    assignShipmentCustomer,
    getShipment,
    updateShipmentStatus,
} from "../../services/shipmentService";
import {
    SHIPMENT_STATUS_TRANSITIONS,
    formatShipmentStatus,
} from "../../constants/shipmentStatuses";
import { formatDate } from "../../utils/formatDate";
import "./Shipments.css";

function formatAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
        ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)
        : "—";
}

export default function ShipmentDetails() {
    const { id } = useParams();
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [notice, setNotice] = useState(location.state?.created ? "Shipment created successfully." : "");
    const [nextStatus, setNextStatus] = useState("");
    const [statusNote, setStatusNote] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setShipment(await getShipment(id));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    async function saveStatus(event) {
        event.preventDefault();
        if (!nextStatus) return;
        setBusy(true);
        setMutationError("");
        setNotice("");
        try {
            const updated = await updateShipmentStatus(id, { status: nextStatus, note: statusNote });
            setShipment(updated);
            setNextStatus("");
            setStatusNote("");
            setNotice(`Shipment status updated to ${formatShipmentStatus(updated.status)}.`);
        } catch (requestError) {
            setMutationError(requestError.message);
        } finally {
            setBusy(false);
        }
    }

    async function assignCustomer(event) {
        event.preventDefault();
        if (!customerId.trim()) return;
        if (!/^[\da-f]{24}$/i.test(customerId.trim())) {
            setMutationError("Enter a valid 24-character customer ID.");
            return;
        }
        setBusy(true);
        setMutationError("");
        setNotice("");
        try {
            setShipment(await assignShipmentCustomer(id, customerId));
            setCustomerId("");
            setNotice("Shipment assigned to the customer.");
        } catch (requestError) {
            setMutationError(requestError.message);
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <Loader label="Loading shipment" showLabel />;
    if (error || !shipment) {
        return (
            <section className="feature-page">
                <p className="feature-page__error" role="alert">{error || "Shipment not found."}</p>
                <Link to="/shipments">Back to shipments</Link>
            </section>
        );
    }

    const history = shipment.statusHistory ?? shipment.timeline ?? [];
    const allowedStatuses = SHIPMENT_STATUS_TRANSITIONS[shipment.status] ?? [];
    return (
        <section className="feature-page shipment-details">
            <header className="feature-page__header">
                <div>
                    <p><Link to="/shipments">Shipments</Link></p>
                    <h1 className="shipment-details__tracking">{shipment.trackingNumber}</h1>
                    <p className="feature-page__muted">{shipment.customer ?? "Customer not assigned"}</p>
                </div>
                <div className="shipment-details__actions">
                    <span className={`shipment-status shipment-status--${shipment.status}`}>{formatShipmentStatus(shipment.status)}</span>
                    {shipment.trackingNumber && <Link to={`/track/${encodeURIComponent(shipment.trackingNumber)}`}>Public tracking page</Link>}
                </div>
            </header>

            {notice && <p className="feature-page__notice" role="status" aria-live="polite">{notice}</p>}
            {mutationError && <p className="feature-page__error" role="alert">{mutationError}</p>}

            <section className="feature-page__panel">
                <h2>Shipment details</h2>
                <dl className="feature-page__definition">
                    <div><dt>Tracking number</dt><dd>{shipment.trackingNumber}</dd></div>
                    <div><dt>Customer</dt><dd>{shipment.customer ?? "Unassigned"}</dd></div>
                    <div><dt>Origin</dt><dd>{shipment.origin}</dd></div>
                    <div><dt>Destination</dt><dd>{shipment.destination}</dd></div>
                    <div><dt>Amount</dt><dd>{formatAmount(shipment.amount)}</dd></div>
                    <div><dt>Created</dt><dd>{formatDate(shipment.createdAt, { withTime: true })}</dd></div>
                    <div><dt>Last updated</dt><dd>{formatDate(shipment.updatedAt, { withTime: true })}</dd></div>
                </dl>
            </section>

            <section className="feature-page__panel">
                <h2>Status history</h2>
                {history.length ? (
                    <ol className="shipment-timeline">
                        {history.map((entry, index) => (
                            <li key={`${entry.status}-${entry.timestamp ?? entry.at}-${index}`}>
                                <div>
                                    <strong>{formatShipmentStatus(entry.status)}</strong>
                                    <time dateTime={entry.timestamp ?? entry.at}>{formatDate(entry.timestamp ?? entry.at, { withTime: true })}</time>
                                    {entry.note && <p>{entry.note}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : <p className="feature-page__muted">No status history is available.</p>}
            </section>

            {isAdmin && (
                <div className="shipment-admin-actions">
                    {allowedStatuses.length > 0 && (
                        <form className="feature-page__panel feature-page__form" onSubmit={saveStatus}>
                            <h2>Update status</h2>
                            <label>
                                Next status
                                <select name="status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} required>
                                    <option value="">Choose a valid transition</option>
                                    {allowedStatuses.map((status) => <option key={status} value={status}>{formatShipmentStatus(status)}</option>)}
                                </select>
                            </label>
                            <label>
                                Note (optional)
                                <textarea name="note" value={statusNote} maxLength={500} onChange={(event) => setStatusNote(event.target.value)} placeholder="Add a short status note…" />
                            </label>
                            <Button type="submit" loading={busy} disabled={!nextStatus}>Save status</Button>
                        </form>
                    )}
                    <form className="feature-page__panel feature-page__form" onSubmit={assignCustomer}>
                        <h2>Assign customer</h2>
                        <p className="feature-page__muted">Enter the MongoDB ID of an existing customer account.</p>
                        <label>
                            Customer ID
                            <input name="customerId" value={customerId} onChange={(event) => setCustomerId(event.target.value)} autoComplete="off" spellCheck={false} maxLength={24} placeholder="24-character customer ID…" />
                        </label>
                        <Button type="submit" loading={busy} disabled={!customerId.trim()}>Assign shipment</Button>
                    </form>
                </div>
            )}
        </section>
    );
}
