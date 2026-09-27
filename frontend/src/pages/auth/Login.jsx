// src/pages/auth/Login.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || '');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const justRegistered = Boolean(location.state?.justRegistered);

    // Sent here by ProtectedRoute? Return to that page after login instead
    // of always landing on the dashboard.
    const redirectTo = location.state?.from
        ? location.state.from.pathname + location.state.from.search
        : '/dashboard';

    const handleSubmit = async (event) => {
        event.preventDefault();

        const errors = {};
        if (!email.trim()) errors.email = 'Email is required.';
        if (!password) errors.password = 'Password is required.';
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);
        try {
            await login({ email: email.trim(), password });
            navigate(redirectTo, { replace: true });
        } catch (err) {
            // Deliberately vague on which field is wrong for a login failure —
            // "email or password is incorrect" avoids confirming which emails
            // are registered.
            if (err?.status === 401) {
                setFormError('Email or password is incorrect.');
            } else if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
                setFieldErrors(err.fieldErrors);
            } else {
                setFormError(err?.message || 'Unable to log in. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-page__card" onSubmit={handleSubmit} noValidate>
                <h1 className="login-page__title">Log in</h1>

                {justRegistered && !formError && (
                    <p className="login-page__success">Account created — log in to continue.</p>
                )}

                {formError && (
                    <p className="login-page__error" role="alert">
                        {formError}
                    </p>
                )}

                <Input
                    label="Email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={fieldErrors.email}
                    placeholder="you@example.com"
                />

                <Input
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={fieldErrors.password}
                    placeholder="••••••••"
                />

                <div className="login-page__footer">
                    <Link to="/forgot-password" className="login-page__forgot-link">
                        Forgot password?
                    </Link>
                    <Button type="submit" variant="primary" loading={submitting}>
                        Log in
                    </Button>
                </div>

                <Link to="/signup" className="login-page__signup-link">
                    Don't have an account? Sign up
                </Link>
            </form>
        </div>
    );
}