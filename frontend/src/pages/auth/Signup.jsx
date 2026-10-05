import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLockup } from "../../components/BrandLockup";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../../components/common/Input";
import { PasswordInput } from "../../components/common/PasswordInput";
import { validateSignup } from "../../utils/validateSignup";

export default function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    function updateField(setter, field) {
        return (event) => {
            setter(event.target.value);
            setFieldErrors((current) => ({ ...current, [field]: undefined }));
            setError("");
        };
    }

    function focusFirstError(errors) {
        document.getElementById(Object.keys(errors)[0])?.focus();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        const validation = validateSignup({ name, email, password, confirmPassword });
        if (Object.keys(validation).length > 0) {
            setFieldErrors(validation);
            focusFirstError(validation);
            return;
        }
        setFieldErrors({});
        setSubmitting(true);

        try {
            await register({ name, email, password });
            navigate("/dashboard", { replace: true });
        } catch (requestError) {
            const serverFieldErrors = requestError.fieldErrors ?? {};
            setFieldErrors(serverFieldErrors);
            if (Object.keys(serverFieldErrors).length > 0) focusFirstError(serverFieldErrors);
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
                    <h1 className="auth-title">Create account</h1>
                    <p className="auth-description">
                        Start managing your webhook events and delivery attempts.
                    </p>
                </div>
                {error && <p className="auth-card__error" role="alert">{error}</p>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        id="name"
                        label="Full name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        maxLength={60}
                        placeholder="Your full name…"
                        value={name}
                        onChange={updateField(setName, "name")}
                        error={fieldErrors.name}
                        required
                    />
                    <Input
                        id="email"
                        label="Email address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="name@example.com…"
                        value={email}
                        onChange={updateField(setEmail, "email")}
                        error={fieldErrors.email}
                        required
                    />
                    <div className="form-group">
                        <PasswordInput
                            id="password"
                            label="Password"
                            name="password"
                            autoComplete="new-password"
                            minLength={12}
                            placeholder="Create a password…"
                            value={password}
                            onChange={updateField(setPassword, "password")}
                            error={fieldErrors.password}
                            required
                        />
                        <small>Use at least 12 characters.</small>
                    </div>
                    <PasswordInput
                        id="confirmPassword"
                        label="Confirm password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        minLength={12}
                        placeholder="Re-enter your password…"
                        value={confirmPassword}
                        onChange={updateField(setConfirmPassword, "confirmPassword")}
                        error={fieldErrors.confirmPassword}
                        required
                    />
                    <button type="submit" className="primary-button" disabled={submitting} aria-busy={submitting}>
                        {submitting ? "Creating account…" : "Create account"}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
                <Link className="auth-home-link" to="/">Back to home</Link>
            </section>
        </main>
    );
}
