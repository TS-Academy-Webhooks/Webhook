export const WEBHOOK_EVENTS = [
    { value: 'order.created', label: 'Order Created', description: 'Triggered when a new order is created.' },
    { value: 'order.paid', label: 'Order Paid', description: 'Triggered when payment is confirmed.' },
    { value: 'order.shipped', label: 'Order Shipped', description: 'Triggered when an order is shipped.' },
    { value: 'order.cancelled', label: 'Order Cancelled', description: 'Triggered when an order is cancelled.' },
    { value: 'shipment.created', label: 'Shipment Created', description: 'Triggered when a new shipment is registered.' },
    { value: 'shipment.picked_up', label: 'Shipment Picked Up', description: 'Triggered when the courier picks up the shipment.' },
    { value: 'shipment.in_transit', label: 'Shipment In Transit', description: 'Triggered when the shipment is moving between hubs.' },
    { value: 'shipment.arrived_at_hub', label: 'Arrived at Hub', description: 'Triggered when the shipment arrives at a sorting hub.' },
    { value: 'shipment.out_for_delivery', label: 'Out for Delivery', description: 'Triggered when the shipment is out for final delivery.' },
    { value: 'shipment.delivered', label: 'Shipment Delivered', description: 'Triggered when the shipment is successfully delivered.' },
    { value: 'shipment.delivery_failed', label: 'Delivery Failed', description: 'Triggered when a delivery attempt fails.' },
    { value: 'shipment.cancelled', label: 'Shipment Cancelled', description: 'Triggered when a shipment is cancelled.' },
];

export const WEBHOOK_EVENT_VALUES = WEBHOOK_EVENTS.map((e) => e.value);
