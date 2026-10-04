import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getEvent, resendDelivery, getDeliveries } from "../../services/deliveryService";

function statusStyles(status) {
  switch (status) {
    case "success":
      return "bg-primary/10 text-primary";
    case "failed":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function formatPayload(payload) {
  if (payload === undefined || payload === null) return "No payload";
  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getEvent(eventId)
      .then((data) => {
        if (cancelled) return;
        setEvent(data.event);
        setDeliveries(data.deliveries || []);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          navigate("/");
          return;
        }
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, navigate]);

  const handleRetry = async (deliveryId) => {
    setRetryingId(deliveryId);
    setMessage("");
    try {
      await resendDelivery(deliveryId);
      setMessage("Retry request submitted as a new delivery attempt.");
      const result = await getDeliveries({ eventId, page: 1, limit: 100 });
      setDeliveries(result.items);
    } catch (retryError) {
      setMessage(retryError.message);
    } finally {
      setRetryingId("");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p className="text-destructive">{error || "Event not found."}</p>
        <Link to="/deliveries" className="text-primary underline">
          Back to Deliveries
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <Link
        to="/deliveries"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Deliveries
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold">{event.type}</h1>
        <p className="text-sm text-muted-foreground mt-1">{event.eventId}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Event Type</span>
          <span>{event.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Triggered At</span>
          <span>{formatDate(event.createdAt)}</span>
        </div>
        {event.shipment?.trackingNumber && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tracking Number</span>
            <span>{event.shipment.trackingNumber}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">
          Payload
        </h2>
        <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto text-left">
          {formatPayload(event.payload)}
        </pre>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <h2 className="text-sm font-medium text-muted-foreground p-4 pb-2">
          Related deliveries
        </h2>
        {message && <p className="px-4 text-sm text-muted-foreground" role="status">{message}</p>}
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Webhook</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Attempts</th>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                  No deliveries for this event.
                </td>
              </tr>
            )}
            {deliveries.map((d) => (
              <tr
                key={d.id}
                onClick={() => navigate(`/deliveries/${d.id}`)}
                className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-2">{d.webhook?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles(
                      d.status
                    )}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-2">{d.attemptCount}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatDate(d.createdAt)}
                </td>
                <td className="px-4 py-2">
                  {d.status === "failed" && (
                    <button
                      type="button"
                      disabled={retryingId === d.id}
                      onClick={(e) => { e.stopPropagation(); handleRetry(d.id); }}
                    >
                      {retryingId === d.id ? "Retrying…" : "Retry"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EventDetails;