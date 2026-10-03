import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getDelivery, retryDelivery } from "../../services/deliveryService";

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

function formatResponse(attempt) {
  if (!attempt) return "No attempts yet";
  const code = attempt.statusCode ?? "No response";
  const body = attempt.responseBody || attempt.errorMessage || "";
  return body ? `HTTP ${code}\n${body}` : `HTTP ${code}`;
}

function DeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDelivery(id)
      .then((data) => {
        if (cancelled) return;
        setDelivery(data);
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
  }, [id, reloadKey, navigate]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryMessage("");
    try {
      await retryDelivery(id);
      setRetryMessage("Retry queued. Refreshing...");
      setTimeout(() => {
        setReloadKey((k) => k + 1);
        setIsRetrying(false);
        setRetryMessage("");
      }, 3000);
    } catch (err) {
      setRetryMessage(err.message);
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p className="text-muted-foreground">Loading delivery...</p>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p className="text-destructive">{error || "Delivery not found."}</p>
        <Link to="/deliveries" className="text-primary underline">
          Back to Deliveries
        </Link>
      </div>
    );
  }

  const attempts = delivery.attempts || [];
  const lastAttempt = attempts[attempts.length - 1];
  const eventId = delivery.event?.id ?? delivery.event?._id;

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <Link
        to="/deliveries"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Deliveries
      </Link>

      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-semibold">
          {delivery.webhook?.name ?? "Unknown webhook"}
        </h1>
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles(
            delivery.status
          )}`}
        >
          {delivery.status}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Event Type</span>
          {eventId ? (
            <Link to={`/events/${eventId}`} className="hover:underline">
              {delivery.event?.type}
            </Link>
          ) : (
            <span>{delivery.event?.type ?? "—"}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Target URL</span>
          <span>{delivery.webhook?.url ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Attempts</span>
          <span>
            {delivery.attemptCount} of {delivery.maxAttempts}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created</span>
          <span>{formatDate(delivery.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Attempt</span>
          <span>{formatDate(delivery.lastAttemptAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Request (event payload)
          </h2>
          <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto text-left">
            {formatPayload(delivery.event?.payload)}
          </pre>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Response (latest attempt)
          </h2>
          <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto text-left whitespace-pre-wrap">
            {formatResponse(lastAttempt)}
          </pre>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card mt-4 overflow-hidden">
        <h2 className="text-sm font-medium text-muted-foreground p-4 pb-2">
          Attempt history
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Duration</th>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                  No attempts yet.
                </td>
              </tr>
            )}
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-2">{a.attemptNumber}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles(
                      a.status
                    )}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-2">{a.statusCode ?? "—"}</td>
                <td className="px-4 py-2">
                  {a.durationMs != null ? `${a.durationMs} ms` : "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatDate(a.createdAt)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {a.errorMessage ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {delivery.status === "failed" && (
        <div className="mt-6">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? "Retrying..." : "Retry Delivery"}
          </button>
          {retryMessage && (
            <p className="mt-2 text-sm text-muted-foreground">{retryMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default DeliveryDetails;