// src/components/common/Toggle.jsx
import './Toggle.css';

/**
 * @param {boolean} checked
 * @param {(next: boolean) => void} onChange
 * @param {string} label - accessible name, e.g. `Enable ${webhook.name}`
 * @param {boolean} [disabled]
 */
export function Toggle({ checked, onChange, label, disabled = false }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            className={`toggle ${checked ? 'toggle--on' : ''}`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <span className="toggle__thumb" />
        </button>
    );
}