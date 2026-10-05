import { Link } from "react-router-dom";
import "./MarketingShell.css";

export function MarketingShell({ children }) {
    return (
        <div className="public-marketing">
            <a className="public-marketing__skip" href="#main-content">
                Skip to main content
            </a>
            <header className="public-marketing__header">
                <Link className="public-marketing__brand" to="/" aria-label="Waybridge home">
                    <span aria-hidden="true">W</span>
                    <strong>Waybridge</strong>
                </Link>
                <nav aria-label="Main navigation">
                    <Link to="/about">About</Link>
                    <Link to="/docs">API docs</Link>
                    <Link to="/track">Track shipment</Link>
                </nav>
                <div className="public-marketing__actions">
                    <Link to="/login">Sign in</Link>
                    <Link className="public-marketing__button" to="/signup">Create account</Link>
                </div>
            </header>
            <main id="main-content">{children}</main>
            <footer className="public-marketing__footer">
                <Link className="public-marketing__brand" to="/">
                    <span aria-hidden="true">W</span>
                    <strong>Waybridge</strong>
                </Link>
                <p>Shipment visibility and webhook delivery, in one place.</p>
                <nav aria-label="Footer navigation">
                    <Link to="/about">About</Link>
                    <Link to="/docs">API docs</Link>
                    <Link to="/track">Tracking</Link>
                </nav>
            </footer>
        </div>
    );
}
