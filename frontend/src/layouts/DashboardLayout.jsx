// src/layouts/DashboardLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';
import './DashboardLayout.css';

// Intentionally minimal: this is NOT the final Navbar/Sidebar (that's the
// "Navigation" item under the Core Application team's responsibilities).
// It exists so pages built so far are actually reachable by clicking,
// rather than by typing URLs. Swap it out once the real layout lands —
// just keep the <Outlet /> so nested routes keep rendering.
const NAV_LINKS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/webhooks', label: 'Webhooks' },
];

export default function DashboardLayout() {
    return (
        <div className="dashboard-layout">
            <header className="dashboard-layout__topbar">
                <span className="dashboard-layout__brand">Logistics Platform</span>
                <nav className="dashboard-layout__nav">
                    {NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `dashboard-layout__link ${isActive ? 'dashboard-layout__link--active' : ''}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </header>
            <main className="dashboard-layout__content">
                <Outlet />
            </main>
        </div>
    );
}