// src/components/common/EmptyState.jsx
import './EmptyState.css';

/**
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} [action] - typically a Button
 */
export function EmptyState({ title, description, action }) {
    return (
        <div className="empty-state">
            <p className="empty-state__title">{title}</p>
            {description && <p className="empty-state__description">{description}</p>}
            {action && <div className="empty-state__action">{action}</div>}
        </div>
    );
}