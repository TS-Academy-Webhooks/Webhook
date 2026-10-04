import { Link } from "react-router-dom";

export default function ForgotPassword() {
    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-header">
                    <div className="brand-mark">W</div>
                    <h1 className="auth-title">Password reset</h1>
                    <p className="auth-description">
                        Password reset is not available yet. Contact your administrator for help.
                    </p>
                </div>
                <Link to="/login">Back to sign in</Link>
            </section>
        </main>
    );
}
