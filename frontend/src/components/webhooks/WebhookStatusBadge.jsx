import { Badge } from '../common/Badge';

const variants = { pending: 'warning', delivered: 'success', failed: 'destructive', retrying: 'primary' };
const labels = { pending: 'Pending', delivered: 'Delivered', failed: 'Failed', retrying: 'Retrying' };

export function WebhookStatusBadge({ status }) {
    return <Badge variant={variants[status] ?? 'neutral'}>{labels[status] ?? status ?? 'Unknown'}</Badge>;
}
