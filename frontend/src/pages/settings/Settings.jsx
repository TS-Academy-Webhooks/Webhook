import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import './Settings.css';

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dark, setDark] = useState(false);

    useEffect(() => setDark(localStorage.getItem('webhook-theme') === 'dark'), []);

    function changeTheme() {
        const next = !dark;
        setDark(next);
        localStorage.setItem('webhook-theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', next);
        window.dispatchEvent(new CustomEvent('webhook-theme-change', { detail: next }));
    }

    function signOut() { logout(); navigate('/webhooks', { replace: true }); }

    return (
        <div className="settings-page">
            <header className="settings-page__heading"><h1>Settings</h1><p>Manage your account, appearance, and webhook workspace.</p></header>
            <section className="settings-card">
                <div className="settings-card__heading"><span className="settings-card__icon">◉</span><div><h2>Profile</h2><p>Information connected to your account.</p></div></div>
                <dl className="settings-info-list">
                    <div><dt>Name</dt><dd>{user?.name || '—'}</dd></div>
                    <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
                    <div><dt>Role</dt><dd><span className="settings-pill">{user?.role || 'Member'}</span></dd></div>
                </dl>
            </section>
            <section className="settings-card">
                <div className="settings-card__heading"><span className="settings-card__icon">◐</span><div><h2>Appearance</h2><p>Choose how the Webhook dashboard looks on this device.</p></div></div>
                <div className="settings-row"><div><strong>{dark ? 'Dark mode' : 'Light mode'}</strong><p>Theme preference is saved in this browser.</p></div><button className={`settings-switch ${dark ? 'settings-switch--on' : ''}`} type="button" role="switch" aria-checked={dark} onClick={changeTheme}><span /></button></div>
            </section>
            <section className="settings-card">
                <div className="settings-card__heading"><span className="settings-card__icon">⌁</span><div><h2>Webhook endpoints</h2><p>Manage delivery URLs, subscribed shipment events, and endpoint status.</p></div></div>
                <div className="settings-row"><div><strong>Endpoint configuration</strong><p>Manage order and shipment subscriptions. Secrets are shown only at creation.</p></div><Button as={Link} to="/settings/webhooks" variant="secondary">Manage endpoints</Button></div>
            </section>
            <section className="settings-card settings-card--session">
                <div className="settings-card__heading"><span className="settings-card__icon">↪</span><div><h2>Session</h2><p>Sign out of this device.</p></div></div>
                <Button variant="destructive" onClick={signOut}>Log out</Button>
            </section>
        </div>
    );
}
