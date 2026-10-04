// src/components/common/Badge.jsx
import './Badge.css';

/**
 * @param {'neutral'|'primary'|'success'|'warning'|'destructive'} [variant]
 * @param {React.ReactNode} children
 */
export function Badge({ variant = 'neutral', children }) {
    return <span className={`badge badge--${variant}`}>{children}</span>;
}