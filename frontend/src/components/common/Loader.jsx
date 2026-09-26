// src/components/common/Loader.jsx
import './Loader.css';

/**
 * @param {'sm'|'md'|'lg'} [size]
 * @param {string} [label] - accessible label; also shown visibly if `showLabel`
 * @param {boolean} [showLabel]
 */
export function Loader({ size = 'md', label = 'Loading…', showLabel = false }) {
    return (
        <div className="loader" role="status" aria-live="polite">
            <span className={`loader__spinner loader__spinner--${size}`} aria-hidden="true" />
            {showLabel ? <span>{label}</span> : <span className="loader__sr-only">{label}</span>}
        </div>
    );
}