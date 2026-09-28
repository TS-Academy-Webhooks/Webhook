import { useParams, Link } from "react-router-dom";

const mockDeliveries = {
  del_001: {
    id: "del_001",
    webhookName: "Order Confirmation",
    eventType: "order.created",
    status: "success",
    attempts: 1,
    timestamp: "2026-09-27 14:32",
    url: "https://example.com/webhooks/orders",
    request: `{
  "event": "order.created",
  "order_id": "ord_9231",
  "amount": 4500
}`,
    response: `{
  "status": 200,
  "message": "OK"
}`,
  },
  del_002: {
    id: "del_002",
    webhookName: "Shipment Update",
    eventType: "shipment.dispatched",
    status: "failed",
    attempts: 3,
    timestamp: "2026-09-27 13:10",
    url: "https://example.com/webhooks/shipments",
    request: `{
  "event": "shipment.dispatched",
  "shipment_id": "shp_5521"
}`,
    response: `{
  "status": 500,
  "message": "Internal Server Error"
}`,
  },
  del_003: {
    id: "del_003",
    webhookName: "Payment Received",
    eventType: "payment.success",
    status: "pending",
    attempts: 0,
    timestamp: "2026-09-27 12:45",
    url: "https://example.com/webhooks/payments",
    request: `{
  "event": "payment.success",
  "payment_id": "pay_7781"
}`,
    response: "Not yet delivered",
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

function DeliveryDetails() {
  const { id } = useParams();
  const delivery = mockDeliveries[id];

  if (!delivery) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <p>Delivery not found.</p>
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

      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-semibold">{delivery.webhookName}</h1>
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
          <span>{delivery.eventType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Target URL</span>
          <span>{delivery.url}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Attempts</span>
          <span>{delivery.attempts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Timestamp</span>
          <span>{delivery.timestamp}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Request
          </h2>
          <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto">
            {delivery.request}
          </pre>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Response
          </h2>
          <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto">
            {delivery.response}
          </pre>
        </div>
      </div>

      {delivery.status === "failed" && (
        <button className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          Retry Delivery
        </button>
      )}
    </div>
  );
}

export default DeliveryDetails;