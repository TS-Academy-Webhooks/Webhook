export const SHIPMENT_STATUSES = [
    "created",
    "picked_up",
    "in_transit",
    "arrived_at_hub",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
    "cancelled",
];

export const SHIPMENT_STATUS_LABELS = {
    created: "Created",
    picked_up: "Picked up",
    in_transit: "In transit",
    arrived_at_hub: "Arrived at hub",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    delivery_failed: "Delivery failed",
    cancelled: "Cancelled",
};

export const SHIPMENT_STATUS_TRANSITIONS = {
    created: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "cancelled"],
    in_transit: ["arrived_at_hub", "cancelled"],
    arrived_at_hub: ["in_transit", "out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "delivery_failed"],
    delivery_failed: ["out_for_delivery", "cancelled"],
    delivered: [],
    cancelled: [],
};

export function formatShipmentStatus(status) {
    return SHIPMENT_STATUS_LABELS[status] ?? String(status ?? "Unknown").replaceAll("_", " ");
}
