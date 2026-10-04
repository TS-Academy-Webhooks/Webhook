// src/components/webhooks/WebhookStatus.jsx
import { Badge } from '../common/Badge';
import { Toggle } from '../common/Toggle';
import './WebhookStatus.css';

/**
 * @param {boolean} isActive
 * @param {(next: boolean) => void} [onToggle] - omit to render read-only
 * @param {string} webhookName - used in the toggle's accessible label
 * @param {boolean} [pending] - disables the toggle mid-request
 */
export function WebhookStatus({ isActive, onToggle, webhookName, pending = false }) {
    return (
        <span className="webhook-status">
      <Badge variant={isActive ? 'success' : 'neutral'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
            {onToggle && (
                <Toggle
                    checked={isActive}
                    onChange={onToggle}
                    disabled={pending}
                    label={`${isActive ? 'Disable' : 'Enable'} ${webhookName}`}
                />
            )}
    </span>
    );
}