import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MarketingShell } from "../components/marketing/MarketingShell";
import { trackShipment } from "../services/shipmentService";
import { formatDate } from "../utils/formatDate";
import { formatShipmentStatus } from "../constants/shipmentStatuses";

const TRACKING_PATTERN = /^TRK-\d{5}$/i;

export default function Tracking() {
    const { trackingNumber: routeTrackingNumber } = useParams();
    const navigate = useNavigate();
    const [trackingNumber, setTrackingNumber] = useState(routeTrackingNumber ?? "");
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldError, setFieldError] = useState("");

    const loadShipment = useCallback(async (value) => {
        setShipment(null);
        setError("");
        setFieldError("");
        if (!TRACKING_PATTERN.test(value)) {
            setFieldError("Enter a tracking number in the format TRK-00001.");
            return;
        }

        setLoading(true);
        try {
            setShipment(await trackShipment(value.toUpperCase()));
        } catch (requestError) {
            setError(
                requestError.status === 404
                    ? "We couldn’t find that shipment. Check the number and try again."
                    : requestError.message,
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setTrackingNumber(routeTrackingNumber ?? "");
        if (routeTrackingNumber) void loadShipment(routeTrackingNumber.toUpperCase());
        else {
            setShipment(null);
            setError("");
            setFieldError("");
        }
    }, [routeTrackingNumber, loadShipment]);

    function handleSubmit(event) {
        event.preventDefault();
        const value = trackingNumber.trim().toUpperCase();
        if (!TRACKING_PATTERN.test(value)) {
            setFieldError("Enter a tracking number in the format TRK-00001.");
            setShipment(null);
            document.getElementById("tracking-number")?.focus();
            return;
        }
        navigate(`/track/${encodeURIComponent(value)}`);
    }

    return (
        <MarketingShell>
            <div className="public-page public-page__tracking">
                <header className="public-page__tracking-header">
                    <p className="public-page__eyebrow">Public shipment lookup</p>
                    <h1>Track your shipment.</h1>
                    <p className="public-page__lead">
                        Enter your tracking number to see its current status and recorded history.
                    </p>
                </header>
                <form className="public-page__tracking-form" onSubmit={handleSubmit} noValidate>
                    <label htmlFor="tracking-number">
                        Tracking number
                        <input
                            id="tracking-number"
                            name="trackingNumber"
                            type="text"
                            maxLength={9}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="TRK-00001…"
                            value={trackingNumber}
                            aria-invalid={Boolean(fieldError) || undefined}
                            aria-describedby={fieldError ? "tracking-error" : undefined}
                            onChange={(event) => setTrackingNumber(event.target.value)}
                        />
                    </label>
                    <button type="submit" disabled={loading}>
                        {loading ? "Searching…" : "Track"}
                    </button>
                </form>
                {fieldError && <p className="public-page__alert" id="tracking-error" role="alert">{fieldError}</p>}
                {error && <p className="public-page__alert" role="alert" aria-live="polite">{error}</p>}
                {shipment && (
                    <section className="public-page__tracking-result" aria-labelledby="tracking-result-title" aria-live="polite">
                        <header>
                            <div>
                                <h2 id="tracking-result-title">{shipment.trackingNumber}</h2>
                                <p>Last updated {formatDate(shipment.lastUpdate ?? shipment.lastUpdated, { withTime: true })}</p>
                            </div>
                            <span className={`public-page__status public-page__status--${shipment.status}`}>{formatShipmentStatus(shipment.status)}</span>
                        </header>
                        <dl>
                            <div><dt>Origin</dt><dd>{shipment.origin}</dd></div>
                            <div><dt>Destination</dt><dd>{shipment.destination}</dd></div>
                        </dl>
                        <div>
                            <h3>Shipment history</h3>
                            {shipment.timeline?.length ? (
                                <ol className="public-page__timeline">
                                    {shipment.timeline.map((entry, index) => (
                                        <li key={`${entry.status}-${entry.at ?? entry.timestamp}-${index}`}>
                                            <div>
                                                <strong>{formatShipmentStatus(entry.status)}</strong>
                                                <time dateTime={entry.at ?? entry.timestamp}>{formatDate(entry.at ?? entry.timestamp, { withTime: true })}</time>
                                                {entry.note && <p>{entry.note}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : <p>No status history is available for this shipment.</p>}
                        </div>
                    </section>
                )}
                <p className="public-page__tracking-help">
                    Manage assigned shipments and webhooks from your account. <Link to="/login">Sign in</Link>
                </p>
            </div>
        </MarketingShell>
    );
}
