import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLockup } from "../../components/BrandLockup";
import { PasswordInput } from "../../components/common/PasswordInput";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../../components/common/Input";

export default function Login() {
    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const notice = location.state?.notice;

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await login({ email, password });
            navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
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
                    <BrandLockup className="auth-brand" markSize="large" />

                    <h1 className="auth-title">Welcome back</h1>

                    <p className="auth-description">
                        Sign in to manage your webhooks and monitor event deliveries.
                    </p>
                </div>

                {notice && <p className="auth-card__notice" role="status" aria-live="polite">{notice}</p>}
                {error && <p className="auth-card__error" role="alert">{error}</p>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        id="email"
                        label="Email address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="name@example.com…"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="password">Password</label>
                            <Link to="/forgot-password">Password recovery unavailable</Link>
                        </div>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Enter your password…"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            aria-label="Password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting}
                    >
                        {submitting ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don’t have an account?{" "}
                    <Link to="/signup">Create account</Link>
                </p>
                <Link className="auth-home-link" to="/">Back to home</Link>
            </section>
        </main>
    );
}
