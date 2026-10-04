import { Link } from "react-router-dom";

export default function ForgotPassword() {
    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1>Password reset</h1>
                <p>Password reset is not available yet. Contact your administrator for help.</p>
                <Link to="/login">Back to sign in</Link>
            </section>
        </main>
    );
}
