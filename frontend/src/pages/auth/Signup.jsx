import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setSubmitting(true);

        try {
            await register({ name, email, password });
            navigate("/webhooks", { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-header">
                    <div className="brand-mark">W</div>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-description">
                        Start managing your webhook events and delivery attempts.
                    </p>
                </div>
                {error && <p className="auth-card__error" role="alert">{error}</p>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full name</label>
                        <input
                            id="name"
                            type="text"
                            autoComplete="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Create a password"
                            minLength={12}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                        <small>Use at least 12 characters.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Creating account..." : "Create account"}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
}
