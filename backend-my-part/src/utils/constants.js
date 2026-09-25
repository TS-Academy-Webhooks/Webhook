// The fixed list of shipment statuses. Each one (except the terminal
// ones) has a matching event type of the form "shipment.<status>".
const SHIPMENT_STATUSES = [
  "created",
  "picked_up",
  "in_transit",
  "arrived_at_hub",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "cancelled",
];

// Event types that webhooks can subscribe to.
// "*" (handled separately, not in this list) means "subscribe to everything".
const SHIPMENT_EVENT_TYPES = SHIPMENT_STATUSES.map((s) => `shipment.${s}`);

// Which statuses a shipment is allowed to move to, from its current status.
// An empty array means the status is terminal (no further moves allowed).
const VALID_TRANSITIONS = {
  created: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["arrived_at_hub", "cancelled"],
  arrived_at_hub: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "delivery_failed", "cancelled"],
  delivery_failed: ["out_for_delivery", "cancelled"], // retry redelivery
  delivered: [],
  cancelled: [],
};

function isValidTransition(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

module.exports = {
  SHIPMENT_STATUSES,
  SHIPMENT_EVENT_TYPES,
  VALID_TRANSITIONS,
  isValidTransition,
};
