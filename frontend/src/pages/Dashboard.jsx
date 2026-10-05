import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { StatCard } from "../components/dashboard/StatCard";
import { Loader } from "../components/common/Loader";
import { getShipments } from "../services/shipmentService";
import { getWebhooks } from "../services/webhookService";
import { getDeliveries } from "../services/deliveryService";
import { getEvents } from "../services/eventService";
import { formatDate } from "../utils/formatDate";
import { formatEventType } from "../utils/formatEventType";
import "../styles/Dashboard.css";

function countValue(result) {
    return result.status === "fulfilled" ? result.value.pagination.total : null;
}

export default function Dashboard() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [stats, setStats] = useState({
        shipments: null,
        webhooks: null,
        delivered: null,
        failed: null,
        events: null,
        deliveryRate: null,
    });
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        let alive = true;
        async function load() {
            setLoading(true);
            const requests = [
                getShipments({ page: 1, limit: 1 }),
                getWebhooks({ page: 1, limit: 1 }),
                getDeliveries({ page: 1, limit: 5 }),
                getDeliveries({ page: 1, limit: 1, status: "success" }),
                getDeliveries({ page: 1, limit: 1, status: "failed" }),
                ...(isAdmin ? [getEvents({ page: 1, limit: 1 })] : []),
            ];
            const results = await Promise.allSettled(requests);
            if (!alive) return;

            const shipmentResult = results[0];
            const webhookResult = results[1];
            const recentResult = results[2];
            const successResult = results[3];
            const failedResult = results[4];
            const eventResult = isAdmin ? results[5] : null;
            const successCount = countValue(successResult);
            const failedCount = countValue(failedResult);
            const denominator =
                successCount === null || failedCount === null
                    ? 0
                    : successCount + failedCount;

            setStats({
                shipments: countValue(shipmentResult),
                webhooks: countValue(webhookResult),
                delivered: successCount,
                failed: failedCount,
                events: eventResult ? countValue(eventResult) : null,
                deliveryRate: denominator
                    ? `${Math.round((successCount / denominator) * 100)}%`
                    : denominator === 0 && successCount === 0 && failedCount === 0
                        ? "—"
                        : null,
            });
            if (recentResult.status === "fulfilled") setRecent(recentResult.value.items);
            else setRecent([]);

            setErrors(
                results
                    .filter((result) => result.status === "rejected")
                    .map((result) => result.reason?.message || "Unable to load part of the dashboard."),
            );
            setLoading(false);
        }

        void load();
        return () => { alive = false; };
    }, [isAdmin]);

    const showValue = (value) => value ?? "—";
    return (
        <section className="dashboard-page">
            <header className="dashboard-page__header">
                <div>
                    <p className="dashboard-title">{isAdmin ? "Operations overview" : "Your account"}</p>
                    <h1>Dashboard</h1>
                    <p className="page-description">
                        Welcome back, {user?.name || "there"}. Here’s the latest shipment and webhook activity available to your account.
                    </p>
                </div>
                <div className="dashboard-page__actions">
                    <Link to="/shipments/new">Create shipment</Link>
                    <Link to="/webhooks/new">Create webhook</Link>
                </div>
            </header>

            {errors.length > 0 && (
                <div className="dashboard-page__error" role="status" aria-live="polite">
                    Some dashboard data could not be loaded: {errors.join(" ")}
                </div>
            )}

            <div className="dashboard-page__stats">
                <StatCard label="Shipments" value={showValue(stats.shipments)} loading={loading} />
                <StatCard label="Webhook endpoints" value={showValue(stats.webhooks)} loading={loading} />
                <StatCard label="Successful deliveries" value={showValue(stats.delivered)} loading={loading} />
                <StatCard label="Failed deliveries" value={showValue(stats.failed)} loading={loading} />
                {isAdmin && <StatCard label="Shipment events" value={showValue(stats.events)} loading={loading} />}
                <StatCard label="Success rate" value={showValue(stats.deliveryRate)} loading={loading} />
            </div>

            <section className="feature-page__panel dashboard-recent">
                <div className="dashboard-recent__header">
                    <div>
                        <h2>Recent delivery summaries</h2>
                        <p className="feature-page__muted">Latest webhook outcomes and attempt history.</p>
                    </div>
                    <Link to="/deliveries">View all</Link>
                </div>
                {loading ? <Loader label="Loading recent deliveries" showLabel /> : recent.length ? (
                    <div className="feature-page__table">
                        <table>
                            <thead><tr><th scope="col">Event</th><th scope="col">Webhook</th><th scope="col">Status</th><th scope="col">Attempts</th><th scope="col">Last update</th></tr></thead>
                            <tbody>
                                {recent.map((delivery) => (
                                    <tr key={delivery.id}>
                                        <td><Link to={`/deliveries/${encodeURIComponent(delivery.id)}`}>{delivery.event?.eventId ?? formatEventType(delivery.event?.type ?? "Delivery")}</Link></td>
                                        <td>{delivery.webhook?.name ?? delivery.webhook?.url ?? "—"}</td>
                                        <td>{delivery.status}</td>
                                        <td>{delivery.attemptCount}</td>
                                        <td>{formatDate(delivery.attemptedAt ?? delivery.updatedAt ?? delivery.createdAt, { withTime: true })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="feature-page__muted">No delivery summaries yet. Once a webhook receives an event, its delivery will appear here.</p>}
            </section>

            <nav className="dashboard-page__links" aria-label="Dashboard quick links">
                <Link to="/shipments">View shipments</Link>
                <Link to="/webhooks">Manage webhooks</Link>
                {isAdmin && <Link to="/events">Inspect shipment events</Link>}
                <Link to="/tools/demo-receiver">Open demo receiver</Link>
            </nav>
        </section>
    );
}
