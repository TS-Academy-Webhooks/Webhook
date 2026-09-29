import { useParams, Link } from "react-router-dom";

const mockEvents = {
  evt_001: {
    id: "evt_001",
    eventType: "order.created",
    webhookName: "Order Confirmation",
    triggeredAt: "2026-09-27 14:32",
    payload: `{
  "event": "order.created",
  "order_id": "ord_9231",
  "customer": "John Doe",
  "amount": 4500,
  "currency": "NGN"
}`,
    relatedDeliveries: [
      { id: "del_001", status: "success", timestamp: "2026-09-27 14:32" },
    ],
  },
  evt_002: {
    id: "evt_002",
    eventType: "shipment.dispatched",
    webhookName: "Shipment Update",
    triggeredAt: "2026-09-27 13:10",
    payload: `{
  "event": "shipment.dispatched",
  "shipment_id": "shp_5521",
  "carrier": "DHL",
  "tracking_number": "DHL123456789"
}`,
    relatedDeliveries: [
      { id: "del_002", status: "failed", timestamp: "2026-09-27 13:10" },
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

function EventDetails() {
  const { eventId } = useParams();
  const event = mockEvents[eventId];

  if (!event) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p>Event not found.</p>
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

      <h1 className="text-2xl font-semibold mt-4 mb-1">{event.eventType}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Webhook: {event.webhookName} • {event.triggeredAt}
      </p>

      <div className="rounded-lg border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">
          Event Payload
        </h2>
        <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto text-left">
          {event.payload}
        </pre>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Related Deliveries
        </h2>
        <div className="space-y-2">
          {event.relatedDeliveries.map((delivery) => (
            <Link
              key={delivery.id}
              to={`/deliveries/${delivery.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-md border border-border hover:bg-muted/30 text-sm"
            >
              <span>{delivery.id}</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles(
                  delivery.status
                )}`}
              >
                {delivery.status}
              </span>
              <span className="text-muted-foreground">
                {delivery.timestamp}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventDetails;