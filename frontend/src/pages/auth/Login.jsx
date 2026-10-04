// src/pages/auth/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";

function Login() {
    const navigate = useNavigate();

    const { login } = useAuth();

    // Form state.
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // Used to display API/form errors.
    const [errorMessage, setErrorMessage] = useState("");

    // Used to disable the button while logging in.
    const [submitting, setSubmitting] = useState(false);

    // Update the corresponding field when the user types.
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSubmitting(true);

        try {
            // Send login information to the authentication context.
            await login({email: formData.email, password: formData.password});

            // Navigate to the protected dashboard after successful login.
            navigate("/dashboard");

        } catch (error) {
        // Display a backend error if one exists.
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.message ||
                    "Unable to log in. Please check your credentials."
            );
            } else {
                setErrorMessage("Something went wrong. Please try again");
            }
        } finally {
            setSubmitting(false);
        }
    };

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

                {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email address</label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
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
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
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

export default Login;