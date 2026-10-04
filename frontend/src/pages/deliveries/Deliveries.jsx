import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pagination } from "../../components/common/Pagination";
import { Loader } from "../../components/common/Loader";
import { getDeliveries } from "../../services/deliveryService";
import { formatDate } from "../../utils/formatDate";

export default function Deliveries() {
    const [searchParams] = useSearchParams();
    const webhookId = searchParams.get("webhookId");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        getDeliveries({
            page,
            limit: 15,
            status: status || undefined,
            webhookId: webhookId || undefined,
        })
            .then((data) => {
                if (active) setResult(data);
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [page, status, webhookId]);

    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <h1>Delivery attempts</h1>
                    <p className="feature-page__muted">
                        Review webhook delivery results and retry failed attempts.
                    </p>
                </div>
                {webhookId && <Link to="/webhooks">Back to endpoints</Link>}
            </header>
            <div className="feature-page__toolbar">
                <select
                    aria-label="Filter delivery status"
                    value={status}
                    onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All results</option>
                    <option value="success">Successful</option>
                    <option value="failed">Failed</option>
                </select>
            </div>
            {error && <p role="alert" className="feature-page__error">{error}</p>}
            {loading ? (
                <Loader showLabel label="Loading delivery attempts" />
            ) : (
                <>
                    <div className="feature-page__table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Delivery</th>
                                    <th>Event</th>
                                    <th>Endpoint</th>
                                    <th>Status</th>
                                    <th>Attempt</th>
                                    <th>HTTP status</th>
                                    <th>Response time</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(result?.items ?? []).map((delivery) => (
                                    <tr key={delivery.id}>
                                        <td><Link to={`/deliveries/${delivery.id}`}>{delivery.id}</Link></td>
                                        <td>
                                            {delivery.event?.eventId ? (
                                                <Link to={`/events/${delivery.event.id ?? delivery.event._id}`}>
                                                    {delivery.event.eventId}
                                                </Link>
                                            ) : "—"}
                                        </td>
                                        <td>{delivery.webhook?.name ?? delivery.webhook?.url ?? "—"}</td>
                                        <td>{delivery.status}</td>
                                        <td>{delivery.attemptNumber ?? "—"}</td>
                                        <td>{delivery.httpStatus ?? "—"}</td>
                                        <td>{delivery.duration != null ? `${delivery.duration} ms` : "—"}</td>
                                        <td>{formatDate(delivery.attemptedAt ?? delivery.createdAt, { withTime: true })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!result?.items.length && (
                        <p className="feature-page__muted">No delivery attempts found.</p>
                    )}
                    <Pagination pagination={result?.pagination} onPageChange={setPage} />
                </>
            )}
        </section>
    );
}
