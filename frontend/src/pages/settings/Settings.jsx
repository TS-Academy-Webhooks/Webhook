import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { PasswordInput } from "../../components/common/PasswordInput";
import { useAuth } from "../../hooks/useAuth";
import { changePassword } from "../../services/authService";
import "./Settings.css";

function readTheme() {
    try {
        return localStorage.getItem("webhook-theme") === "dark";
    } catch {
        return false;
    }
}

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dark, setDark] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
    const [passwordNotice, setPasswordNotice] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => setDark(readTheme()), []);

    function changeTheme() {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
            localStorage.setItem("webhook-theme", next ? "dark" : "light");
        } catch {
            // Theme applies for this page view if storage is unavailable.
        }
        window.dispatchEvent(new CustomEvent("webhook-theme-change", { detail: next }));
    }

    function updatePassword(event) {
        setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
        setPasswordFieldErrors((current) => ({ ...current, [event.target.name]: undefined }));
        setPasswordError("");
    }

    function showPasswordValidation(field, message) {
        const fieldId = {
            currentPassword: "settings-current-password",
            newPassword: "settings-new-password",
            confirmPassword: "settings-confirm-password",
        }[field];
        setPasswordFieldErrors({ [field]: message });
        document.getElementById(fieldId)?.focus();
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setPasswordError("");
        setPasswordFieldErrors({});
        setPasswordNotice("");
        if (passwords.newPassword.length < 12) {
            showPasswordValidation("newPassword", "New password must be at least 12 characters.");
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            showPasswordValidation("confirmPassword", "New password and confirmation do not match.");
            return;
        }
        if (passwords.currentPassword === passwords.newPassword) {
            showPasswordValidation("newPassword", "Choose a password that differs from your current password.");
            return;
        }

        setSavingPassword(true);
        try {
            await changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            await logout();
            navigate("/login", {
                replace: true,
                state: { notice: "Password changed. Sign in again with your new password." },
            });
        } catch (requestError) {
            const serverFieldErrors = requestError.fieldErrors ?? {};
            setPasswordFieldErrors(serverFieldErrors);
            setPasswordError(Object.keys(serverFieldErrors).length ? "" : requestError.message);
            if (Object.keys(serverFieldErrors).length > 0) {
                const firstField = Object.keys(serverFieldErrors)[0];
                const fieldId = {
                    currentPassword: "settings-current-password",
                    newPassword: "settings-new-password",
                    confirmPassword: "settings-confirm-password",
                }[firstField];
                document.getElementById(fieldId)?.focus();
            }
        } finally {
            setSavingPassword(false);
        }
    }

    function signOut() {
        void logout();
        navigate("/login", { replace: true });
    }

    return (
        <div className="settings-page">
            <header className="settings-page__heading">
                <h1>Settings</h1>
                <p>Manage your account, appearance, and active session.</p>
            </header>

            <section className="settings-card">
                <div className="settings-card__heading">
                    <span className="settings-card__icon" aria-hidden="true">◉</span>
                    <div><h2>Profile</h2><p>Account information is managed by your Waybridge administrator.</p></div>
                </div>
                <dl className="settings-info-list">
                    <div><dt>Name</dt><dd>{user?.name || "—"}</dd></div>
                    <div><dt>Email</dt><dd>{user?.email || "—"}</dd></div>
                    <div><dt>Role</dt><dd><span className="settings-pill">{user?.role || "Customer"}</span></dd></div>
                </dl>
            </section>

            <section className="settings-card">
                <div className="settings-card__heading">
                    <span className="settings-card__icon" aria-hidden="true">◐</span>
                    <div><h2>Appearance</h2><p>Choose how Waybridge looks on this browser.</p></div>
                </div>
                <div className="settings-row">
                    <div><strong>{dark ? "Dark mode" : "Light mode"}</strong><p>Your theme preference is saved on this device.</p></div>
                    <button
                        className={`settings-switch ${dark ? "settings-switch--on" : ""}`}
                        type="button"
                        role="switch"
                        aria-checked={dark}
                        aria-label="Dark mode"
                        onClick={changeTheme}
                    ><span /></button>
                </div>
            </section>

            <section className="settings-card">
                <div className="settings-card__heading">
                    <span className="settings-card__icon" aria-hidden="true">⌁</span>
                    <div><h2>Webhook endpoints</h2><p>Manage delivery URLs, subscribed shipment events, and endpoint status.</p></div>
                </div>
                <div className="settings-row">
                    <div><strong>Endpoint configuration</strong><p>View masked secrets, test an endpoint, or regenerate a signing secret.</p></div>
                    <Button as={Link} to="/webhooks" variant="secondary">Manage webhooks</Button>
                </div>
            </section>

            <section className="settings-card">
                <div className="settings-card__heading">
                    <span className="settings-card__icon" aria-hidden="true">⌑</span>
                    <div><h2>Change password</h2><p>Changing your password revokes active sessions; you’ll need to sign in again.</p></div>
                </div>
                <form className="settings-password-form" onSubmit={handlePasswordSubmit}>
                    {passwordError && <p className="settings-message settings-message--error" role="alert">{passwordError}</p>}
                    {passwordNotice && <p className="settings-message" role="status" aria-live="polite">{passwordNotice}</p>}
                    <PasswordInput id="settings-current-password" label="Current password" name="currentPassword" autoComplete="current-password" value={passwords.currentPassword} onChange={updatePassword} error={passwordFieldErrors.currentPassword} required />
                    <PasswordInput id="settings-new-password" label="New password" name="newPassword" autoComplete="new-password" minLength={12} value={passwords.newPassword} onChange={updatePassword} error={passwordFieldErrors.newPassword} required />
                    <PasswordInput id="settings-confirm-password" label="Confirm new password" name="confirmPassword" autoComplete="new-password" minLength={12} value={passwords.confirmPassword} onChange={updatePassword} error={passwordFieldErrors.confirmPassword} required />
                    <Button type="submit" variant="primary" loading={savingPassword}>Change password</Button>
                </form>
            </section>

            <section className="settings-card settings-card--unavailable">
                <div className="settings-card__heading">
                    <span className="settings-card__icon" aria-hidden="true">!</span>
                    <div><h2>Not available</h2><p>These capabilities are not provided by the current backend.</p></div>
                </div>
                <ul>
                    <li><Link to="/settings/api-keys">API-key management is unavailable; the API has no key-management endpoints.</Link></li>
                    <li>Email-backed password recovery is unavailable because no recovery email provider is configured.</li>
                </ul>
            </section>

            <section className="settings-card settings-card--session">
                <div className="settings-card__heading">
                    <span className="settings-card__icon" aria-hidden="true">↪</span>
                    <div><h2>Session</h2><p>Sign out and revoke this browser session.</p></div>
                </div>
                <Button variant="destructive" onClick={signOut}>Log out</Button>
            </section>
        </div>
    );
}
