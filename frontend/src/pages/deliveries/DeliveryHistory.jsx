import { useParams, Link } from "react-router-dom";

const mockHistory = {
  webhook_001: {
    webhookName: "Order Confirmation",
    deliveries: [
      {
        id: "del_001",
        eventType: "order.created",
        status: "success",
        attempts: 1,
        timestamp: "2026-09-27 14:32",
      },
      {
        id: "del_004",
        eventType: "order.created",
        status: "success",
        attempts: 1,
        timestamp: "2026-09-26 09:15",
      },
      {
        id: "del_005",
        eventType: "order.updated",
        status: "failed",
        attempts: 2,
        timestamp: "2026-09-25 18:47",
      },
    ],
  },
  webhook_002: {
    webhookName: "Shipment Update",
    deliveries: [
      {
        id: "del_002",
        eventType: "shipment.dispatched",
        status: "failed",
        attempts: 3,
        timestamp: "2026-09-27 13:10",
      },
    ],
  },
};

function statusStyles(status) {
  switch (status) {
    case "success":
      return "bg-primary/10 text-primary";
    case "failed":
      return "bg-destructive/10 text-destructive";
    case "pending":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function DeliveryHistory() {
  const { webhookId } = useParams();
  const webhook = mockHistory[webhookId];

  if (!webhook) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p>No history found for this webhook.</p>
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

      <h1 className="text-2xl font-semibold mt-4 mb-6">
        Delivery History — {webhook.webhookName}
      </h1>

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
            {webhook.deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className="border-t border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">{delivery.eventType}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles(
                      delivery.status
                    )}`}
                  >
                    {delivery.status}
                  </span>
                </td>
                <td className="px-4 py-3">{delivery.attempts}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {delivery.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeliveryHistory;