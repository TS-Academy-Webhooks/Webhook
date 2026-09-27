// src/components/dashboard/StatCard.jsx
import './StatCard.css';

/**
 * @param {string} label
 * @param {string|number} value
 * @param {boolean} [loading]
 */
export function StatCard({ label, value, loading = false }) {
    return (
        <div className="stat-card">
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{loading ? '—' : value}</p>
        </div>
    );
}