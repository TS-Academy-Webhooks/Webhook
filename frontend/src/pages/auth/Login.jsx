import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await login({ email, password });
            navigate(location.state?.from?.pathname || "/webhooks", { replace: true });
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

                    <h1 className="auth-title">Welcome back</h1>

                    <p className="auth-description">
                        Sign in to manage your webhooks and monitor event deliveries.
                    </p>
                </div>

                {error && <p className="auth-card__error" role="alert">{error}</p>}

                <form onSubmit={handleSubmit} className="auth-form">
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
                        <div className="form-label-row">
                            <label htmlFor="password">Password</label>

                            <Link to="/forgot-password">
                                Forgot password?
                            </Link>
                        </div>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting}
                    >
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/signup">Create an account</Link>
                </p>
            </section>
        </main>
    );
}
