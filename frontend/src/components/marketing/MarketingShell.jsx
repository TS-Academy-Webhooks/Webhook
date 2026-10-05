import { Link } from "react-router-dom";
import { BrandLockup } from "../BrandLockup";
import { MarketingHeader } from "./MarketingHeader";
import "./MarketingShell.css";

export function MarketingShell({ children }) {
    return (
        <div className="public-marketing">
            <a className="public-marketing__skip" href="#main-content">
                Skip to main content
            </a>
            <MarketingHeader />
            <main id="main-content">{children}</main>
            <footer className="public-marketing__footer">
                <BrandLockup className="public-marketing__brand" markSize="compact" />
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
