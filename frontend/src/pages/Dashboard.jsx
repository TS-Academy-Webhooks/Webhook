// src/pages/Dashboard.jsx
// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { getWebhooks } from '../services/webhookService';
// import { StatCard } from '../components/dashboard/StatCard';
// import { Button } from '../components/common/Button';
// import { ROUTES } from '../constants/routes';
// import './Dashboard.css';

// Deliberately lean: only webhook stats, since that's the only area with a
// working backend contract so far. Shipment/event stats slot in the same
// way once those APIs exist — add more getX({ limit: 1, ... }) calls below
// and more <StatCard /> entries.
// export default function Dashboard() {
//     const [counts, setCounts] = useState({ total: null, active: null, inactive: null });
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         let cancelled = false;

//         async function loadCounts() {
//             setLoading(true);
//             setError(null);
//             try {
                // limit: 1 because we only need each response's pagination.total,
                // not the actual rows — cheaper than fetching full lists.
//                 const [totalRes, activeRes, inactiveRes] = await Promise.all([
//                     getWebhooks({ limit: 1 }),
//                     getWebhooks({ limit: 1, active: true }),
//                     getWebhooks({ limit: 1, active: false }),
//                 ]);
//                 if (cancelled) return;
//                 setCounts({
//                     total: totalRes.pagination.total,
//                     active: activeRes.pagination.total,
//                     inactive: inactiveRes.pagination.total,
//                 });
//             } catch (err) {
//                 if (!cancelled) setError(err.message);
//             } finally {
//                 if (!cancelled) setLoading(false);
//             }
//         }

//         loadCounts();
//         return () => {
//             cancelled = true;
//         };
//     }, []);

//     return (
//         <div className="dashboard-page">
//             <div className="dashboard-page__header">
//                 <h1>Dashboard</h1>
//                 <Button as={Link} to={ROUTES.WEBHOOK_NEW} variant="primary">
//                     Create Webhook
//                 </Button>
//             </div>

//             {error && (
//                 <p className="dashboard-page__error" role="alert">
//                     {error}
//                 </p>
//             )}

//             <div className="dashboard-page__stats">
//                 <StatCard label="Total Webhooks" value={counts.total} loading={loading} />
//                 <StatCard label="Active Webhooks" value={counts.active} loading={loading} />
//                 <StatCard label="Inactive Webhooks" value={counts.inactive} loading={loading} />
//             </div>

//             <div className="dashboard-page__links">
//                 <Link to={ROUTES.WEBHOOKS}>View all webhooks →</Link>
//             </div>
//         </div>
//     );
// }

import { useAuth } from "../hooks/useAuth";
function Dashboard() {
  const { user } = useAuth();

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-title">Overview</p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Monitor your webhook activity and delivery performance.
          </p>
        </div>

        <button className="primary-button">
          Create webhook
        </button>
      </div>

      <div className="welcome-card">
        <div>
          <p className="dashboard-title">Welcome back</p>

          <h2>{user?.name || "User"}</h2>

          <p>
            Here's an overview of your webhook activity.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total webhooks</span>

          <strong className="stat-value">0</strong>

          <span className="stat-description">
            Active webhook endpoints
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Events delivered</span>

          <strong className="stat-value">0</strong>

          <span className="stat-description">
            Successfully delivered events
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Failed deliveries</span>

          <strong className="stat-value">0</strong>

          <span className="stat-description">
            Events requiring attention
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Delivery rate</span>

          <strong className="stat-value">0%</strong>

          <span className="stat-description">
            Successful delivery percentage
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Recent deliveries</h2>

              <p>
                Your latest webhook delivery attempts.
              </p>
            </div>
          </div>

          <div className="empty-state">
            <h3>No delivery attempts yet</h3>

            <p>
              Delivery attempts will appear here once your
              webhooks begin receiving events.
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Webhook activity</h2>

              <p>
                A summary of your webhook events.
              </p>
            </div>
          </div>

          <div className="empty-state">
            <h3>No activity yet</h3>

            <p>
              Create a webhook to start receiving events.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;