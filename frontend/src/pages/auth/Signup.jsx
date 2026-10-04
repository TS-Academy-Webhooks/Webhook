import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Signup.css";

export default function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
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
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Create account</h1>
                <p>Create an account to access the webhook platform.</p>
                {error && <p className="auth-card__error" role="alert">{error}</p>}
                <label>
                    Name
                    <input
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </label>
                <label>
                    Email
                    <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <small>Use at least 12 characters.</small>
                </label>
                <button type="submit" disabled={submitting}>
                    {submitting ? "Creating account…" : "Create account"}
                </button>
                <p className="auth-card__footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </form>
        </main>
    );
}
