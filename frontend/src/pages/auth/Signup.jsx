// src/pages/auth/Signup.jsx
import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";


function Signup() {
    const navigate = useNavigate();

    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Copied out const [name, setName] = useState('');

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

        // Check that both password fields match.
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
    }

    // Copied out const clientErrors = validateSignup({ name, email, password, confirmPassword });

        setSubmitting(true);

        try {
            await register(
                formData.name,
                formData.email,
                formData.password
            );

            // Copied out await register({ name: name.trim(), email: email.trim(), password });
            
            navigate('/login'); //, { state: { justRegistered: true, email: email.trim() } });

        } catch (error) {
        // Display a backend error if one exists.
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.message ||
                    "Unable to create your account."
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

                    <h1 className="auth-title">Create your account</h1>

                    <p className="auth-description">
                        Start managing your webhook events and delivery attempts.
                    </p>
                </div>

                {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full name</label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

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
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm password</label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting}
                    >
                        {submitting ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
}

export default Signup;