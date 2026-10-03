import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
//import { Button } from '../../components/common/Button';

function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setSubmitting(true);

    try {
      await forgotPassword(email);

      setMessage(
        "If an account exists with this email, password reset instructions have been sent."
      );
   } catch (error) {
        if (axios.isAxiosError(error)) {
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to process your request."
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

          <h1 className="auth-title">Forgot your password?</h1>

          <p className="auth-description">
            Enter your email address and we'll send you instructions
            to reset your password.
          </p>
        </div>

        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {message && (
          <div className="alert success-alert">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send reset instructions"}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password?{" "}
          <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}

export default ForgotPassword;