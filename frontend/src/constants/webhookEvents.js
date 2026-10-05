export const WEBHOOK_EVENTS = [
    { value: '*', label: 'All shipment events', description: 'Subscribe to every supported shipment event.' },
    { value: 'shipment.created', label: 'Shipment Created', description: 'A new shipment is registered.' },
    { value: 'shipment.picked_up', label: 'Shipment Picked Up', description: 'A courier picks up the shipment.' },
    { value: 'shipment.in_transit', label: 'Shipment In Transit', description: 'The shipment moves between hubs.' },
    { value: 'shipment.arrived_at_hub', label: 'Arrived at Hub', description: 'The shipment arrives at a sorting hub.' },
    { value: 'shipment.out_for_delivery', label: 'Out for Delivery', description: 'The shipment is out for final delivery.' },
    { value: 'shipment.delivered', label: 'Shipment Delivered', description: 'The shipment is successfully delivered.' },
    { value: 'shipment.delivery_failed', label: 'Delivery Failed', description: 'A delivery attempt fails.' },
    { value: 'shipment.cancelled', label: 'Shipment Cancelled', description: 'A shipment is cancelled.' },
];

export const WEBHOOK_EVENT_VALUES = WEBHOOK_EVENTS.map((e) => e.value);
export const SHIPMENT_EVENT_VALUES = WEBHOOK_EVENT_VALUES.filter((value) => value !== '*');
