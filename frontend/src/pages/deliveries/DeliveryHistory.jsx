import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getDeliveries } from "../../services/deliveryService";

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

function DeliveryHistory() {
  const { webhookId } = useParams();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDeliveries(page, { webhookId })
      .then((data) => {
        if (cancelled) return;
        setDeliveries(data.items);
        setPagination(data.pagination);
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
  }, [webhookId, page, navigate]);

  const goToPage = (p) => {
    setLoading(true);
    setError("");
    setPage(p);
  };

  const webhookName = deliveries[0]?.webhook?.name;

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <Link
        to="/deliveries"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Deliveries
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold">
          {webhookName ? `${webhookName} history` : "Delivery history"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pagination.total} deliveries
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Event Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Loading history...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-destructive">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && deliveries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No deliveries found for this webhook.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              deliveries.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => navigate(`/deliveries/${d.id}`)}
                  className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">{d.event?.type ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles(
                        d.status
                      )}`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{d.attemptCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(d.createdAt)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || loading}
          className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= pagination.totalPages || loading}
          className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DeliveryHistory;