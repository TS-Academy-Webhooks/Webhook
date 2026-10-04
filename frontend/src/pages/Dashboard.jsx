// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWebhooks } from '../services/webhookService';
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/common/Button';
import { ROUTES } from '../constants/routes';
import './Dashboard.css';

// Deliberately lean: only webhook stats, since that's the only area with a
// working backend contract so far. Shipment/event stats slot in the same
// way once those APIs exist — add more getX({ limit: 1, ... }) calls below
// and more <StatCard /> entries.
export default function Dashboard() {
    const [counts, setCounts] = useState({ total: null, active: null, inactive: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadCounts() {
            setLoading(true);
            setError(null);
            try {
                // limit: 1 because we only need each response's pagination.total,
                // not the actual rows — cheaper than fetching full lists.
                const [totalRes, activeRes, inactiveRes] = await Promise.all([
                    getWebhooks({ limit: 1 }),
                    getWebhooks({ limit: 1, active: true }),
                    getWebhooks({ limit: 1, active: false }),
                ]);
                if (cancelled) return;
                setCounts({
                    total: totalRes.pagination.total,
                    active: activeRes.pagination.total,
                    inactive: inactiveRes.pagination.total,
                });
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadCounts();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="dashboard-page">
            <div className="dashboard-page__header">
                <h1>Dashboard</h1>
                <Button as={Link} to={ROUTES.WEBHOOK_NEW} variant="primary">
                    Create Webhook
                </Button>
            </div>

            {error && (
                <p className="dashboard-page__error" role="alert">
                    {error}
                </p>
            )}

            <div className="dashboard-page__stats">
                <StatCard label="Total Webhooks" value={counts.total} loading={loading} />
                <StatCard label="Active Webhooks" value={counts.active} loading={loading} />
                <StatCard label="Inactive Webhooks" value={counts.inactive} loading={loading} />
            </div>

            <div className="dashboard-page__links">
                <Link to={ROUTES.WEBHOOKS}>View all webhooks →</Link>
            </div>
        </div>
    );
}