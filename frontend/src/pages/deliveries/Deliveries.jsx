import { useNavigate } from "react-router-dom";

const mockDeliveries = [
  {
    id: "del_001",
    webhookName: "Order Confirmation",
    eventType: "order.created",
    status: "success",
    attempts: 1,
    timestamp: "2026-09-27 14:32",
  },
  {
    id: "del_002",
    webhookName: "Shipment Update",
    eventType: "shipment.dispatched",
    status: "failed",
    attempts: 3,
    timestamp: "2026-09-27 13:10",
  },
  {
    id: "del_003",
    webhookName: "Payment Received",
    eventType: "payment.success",
    status: "pending",
    attempts: 0,
    timestamp: "2026-09-27 12:45",
  },
];

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

function Deliveries() {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Deliveries</h1>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Webhook</th>
              <th className="px-4 py-3 font-medium">Event Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {mockDeliveries.map((delivery) => (
              <tr
                key={delivery.id}
                onClick={() => navigate(`/deliveries/${delivery.id}`)}
                className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">{delivery.webhookName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {delivery.eventType}
                </td>
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

export default Deliveries;