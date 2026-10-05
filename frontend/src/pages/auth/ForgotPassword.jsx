import { Link } from "react-router-dom";
import { BrandLockup } from "../../components/BrandLockup";

export default function ForgotPassword() {
    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-header">
                    <BrandLockup className="auth-brand" markSize="large" />
                    <h1 className="auth-title">Password reset</h1>
                    <p className="auth-description">
                        Email-backed password recovery is unavailable because no recovery email provider is configured. Contact your Waybridge administrator to regain access.
                    </p>
                </div>
                <Link to="/login">Back to sign in</Link>
                <Link className="auth-home-link" to="/">Back to home</Link>
            </section>
        </main>
    );
}
