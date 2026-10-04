// src/components/webhooks/EventSelector.jsx
import { WEBHOOK_EVENTS } from '../../constants/webhookEvents';
import './EventSelector.css';

/**
 * @param {string[]} selected
 * @param {(next: string[]) => void} onChange
 * @param {string} [error]
 */
export function EventSelector({ selected, onChange, error }) {
    const allSelected = selected.length === WEBHOOK_EVENTS.length;

    const toggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const toggleAll = () => {
        onChange(allSelected ? [] : WEBHOOK_EVENTS.map((e) => e.value));
    };

    const errorId = 'event-selector-error';

    return (
        <fieldset className="event-selector" aria-describedby={error ? errorId : undefined}>
            <legend className="event-selector__legend">Events</legend>
            <div className="event-selector__header">
                <button type="button" className="event-selector__select-all" onClick={toggleAll}>
                    {allSelected ? 'Clear all' : 'Select all'}
                </button>
            </div>

            <div className="event-selector__grid">
                {WEBHOOK_EVENTS.map((event) => (
                    <label key={event.value} className="event-selector__option">
                        <input
                            type="checkbox"
                            checked={selected.includes(event.value)}
                            onChange={() => toggle(event.value)}
                        />
                        {event.label}
                    </label>
                ))}
            </div>

            {error && (
                <p id={errorId} className="event-selector__error" role="alert">
                    {error}
                </p>
            )}
        </fieldset>
    );
}