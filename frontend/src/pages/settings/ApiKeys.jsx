import { Link } from "react-router-dom";

export default function ApiKeys() {
    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <p><Link to="/settings">Settings</Link></p>
                    <h1>API key management unavailable</h1>
                </div>
            </header>
            <section className="feature-page__panel settings-unavailable">
                <h2>This backend does not support API keys</h2>
                <p className="feature-page__muted">
                    The current API authenticates browser sessions with short-lived access tokens and an HttpOnly refresh cookie. It has no API-key creation, listing, rotation, or revocation endpoints, so no keys are generated or simulated here.
                </p>
                <Link to="/settings">Back to settings</Link>
            </section>
        </section>
    );
}
