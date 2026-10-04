import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './DashboardLayout.css';

const PLATFORM_LINKS = [
    { to: '/webhooks', label: 'Webhooks', glyph: '⌁' },
    { to: '/events', label: 'Events', glyph: '◷' },
    { to: '/deliveries', label: 'Deliveries', glyph: '↗' },
];

function initials(name = 'User') {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('webhook-theme') === 'dark';
        setDark(saved);
        document.documentElement.classList.toggle('dark', saved);
        const onThemeChange = (event) => {
            const next = Boolean(event.detail);
            setDark(next);
            document.documentElement.classList.toggle('dark', next);
        };
        window.addEventListener('webhook-theme-change', onThemeChange);
        return () => window.removeEventListener('webhook-theme-change', onThemeChange);
    }, []);

    useEffect(() => setSidebarOpen(false), [location.pathname]);

    const toggleTheme = () => setDark((current) => {
        const next = !current;
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('webhook-theme', next ? 'dark' : 'light');
        return next;
    });

    const handleLogout = () => {
        logout();
        navigate('/webhooks', { replace: true });
    };

    const pathParts = location.pathname.split('/').filter(Boolean);
    let title = pathParts.at(-1) || 'Webhooks';
    if (pathParts[0] === 'webhooks') {
        title = pathParts.length === 1 ? 'Webhooks' : 'Webhooks / Event details';
    } else if (pathParts[0] === 'settings') title = pathParts[1] === 'webhooks' ? 'Settings / Webhook endpoints' : 'Settings';
    else if (pathParts[0] === 'events') title = pathParts.length === 1 ? 'Events' : 'Events / Details';
    else if (pathParts[0] === 'deliveries') title = pathParts.length === 1 ? 'Deliveries' : 'Deliveries / Details';
    else title = title.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

    return (
        <div className={`dashboard-shell ${dark ? 'dashboard-shell--dark' : ''}`}>
            {sidebarOpen && <button className="dashboard-shell__scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
            <aside className={`app-sidebar ${sidebarOpen ? 'app-sidebar--open' : ''}`}>
                <NavLink className="app-sidebar__brand" to="/webhooks">
                    <span className="app-sidebar__brand-mark" aria-hidden="true">⌁</span>
                    <span><strong>Webhook</strong><small>Logistics Platform</small></span>
                </NavLink>
                <div className="app-sidebar__section-label">Platform</div>
                <nav className="app-sidebar__nav" aria-label="Platform navigation">
                    {PLATFORM_LINKS.map(({ to, label, glyph }) => (
                        <NavLink key={to} to={to} end={to === '/dashboard'} className={({ isActive }) => `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`}>
                            <span className="app-sidebar__glyph" aria-hidden="true">{glyph}</span><span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="app-sidebar__section-label app-sidebar__section-label--tools">Tools</div>
                <nav className="app-sidebar__nav" aria-label="Tools navigation">
                    <NavLink to="/settings" end className={({ isActive }) => `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`}><span className="app-sidebar__glyph" aria-hidden="true">⚙</span><span>Settings</span></NavLink>
                    <NavLink to="/settings/webhooks" className={({ isActive }) => `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`}><span className="app-sidebar__glyph" aria-hidden="true">⌘</span><span>Webhook endpoints</span></NavLink>
                </nav>
                <div className="app-sidebar__user">
                    <span className="app-sidebar__avatar">{initials(user?.name)}</span>
                    <span className="app-sidebar__user-copy"><strong>{user?.name || 'Account'}</strong><small>{user?.email || 'Signed in'}</small></span>
                </div>
            </aside>

            <div className="dashboard-shell__main">
                <header className="dashboard-topbar">
                    <div className="dashboard-topbar__leading">
                        <button type="button" className="dashboard-topbar__menu" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>☰</button>
                        <span className="dashboard-topbar__separator" />
                        <span className="dashboard-topbar__breadcrumb">Workspace <span>/</span> {title}</span>
                    </div>
                    <div className="dashboard-topbar__actions">
                        <button type="button" className="dashboard-topbar__icon" onClick={toggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title="Toggle appearance">{dark ? '☼' : '◐'}</button>
                        <button type="button" className="dashboard-topbar__logout" onClick={handleLogout}>Log out</button>
                    </div>
                </header>
                <main className="dashboard-layout__content"><Outlet /></main>
            </div>
        </div>
    );
}
