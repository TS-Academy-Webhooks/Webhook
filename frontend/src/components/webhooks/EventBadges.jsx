// src/components/webhooks/EventBadges.jsx
import { formatEventType } from '../../utils/formatEventType';
import './EventBadges.css';

const VISIBLE_COUNT = 2;

/**
 * @param {string[]} events - e.g. ['shipment.delivered', 'shipment.cancelled']
 */
export function EventBadges({ events = [] }) {
    if (events.length === 0) {
        return <span className="event-badges__empty">No events selected</span>;
    }

    const visible = events.slice(0, VISIBLE_COUNT);
    const remaining = events.length - visible.length;

    return (
        <span className="event-badges" title={events.map(formatEventType).join(', ')}>
      {visible.map((event) => (
          <span key={event} className="event-badges__chip">
          {formatEventType(event)}
        </span>
      ))}
            {remaining > 0 && (
                <span className="event-badges__chip event-badges__chip--more">+{remaining}</span>
            )}
    </span>
    );
}