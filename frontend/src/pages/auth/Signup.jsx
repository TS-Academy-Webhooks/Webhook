// src/pages/auth/Signup.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import { validateSignup } from '../../utils/validateSignup';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import './Signup.css';

export default function Signup() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const clientErrors = validateSignup({ name, email, password, confirmPassword });
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);
        try {
            await register({ name: name.trim(), email: email.trim(), password });
            // No auto-login (see authService.register) — send them to Login
            // with the email prefilled and a success banner.
            navigate('/login', { state: { justRegistered: true, email: email.trim() } });
        } catch (err) {
            if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
                setFieldErrors(err.fieldErrors);
            } else {
                setFormError(err?.message || 'Unable to create your account. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="signup-page">
            <form className="signup-page__card" onSubmit={handleSubmit} noValidate>
                <h1 className="signup-page__title">Create an account</h1>

                {formError && (
                    <p className="signup-page__error" role="alert">
                        {formError}
                    </p>
                )}

                <Input
                    label="Name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={fieldErrors.name}
                    placeholder="Jane Doe"
                />

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
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={fieldErrors.password}
                    placeholder="At least 8 characters"
                />

                <Input
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={fieldErrors.confirmPassword}
                    placeholder="••••••••"
                />

                <div className="signup-page__footer">
                    <Link to="/login" className="signup-page__login-link">
                        Already have an account? Log in
                    </Link>
                    <Button type="submit" variant="primary" loading={submitting}>
                        Sign up
                    </Button>
                </div>
            </form>
        </div>
    );
}