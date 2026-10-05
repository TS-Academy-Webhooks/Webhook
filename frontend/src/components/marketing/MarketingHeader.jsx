import { Link, useLocation } from "react-router-dom";
import { BrandLockup } from "../BrandLockup";
import "./MarketingHeader.css";

function SectionLink({ section, children }) {
    const { pathname } = useLocation();
    const href = pathname === "/" ? `#${section}` : `/#${section}`;

    return <a href={href}>{children}</a>;
}

export function MarketingHeader() {
    return (
        <header className="marketing-header">
            <BrandLockup className="marketing-header__brand" markSize="default" />
            <nav className="marketing-header__nav" aria-label="Main navigation">
                <SectionLink section="platform">Platform</SectionLink>
                <SectionLink section="workflow">How it works</SectionLink>
                <Link to="/about">About</Link>
                <Link to="/docs">API docs</Link>
                <Link to="/track">Track shipment</Link>
            </nav>
            <div className="marketing-header__actions">
                <Link className="marketing-header__signin" to="/login">Sign in</Link>
                <Link className="marketing-header__button" to="/signup">Create account</Link>
            </div>
        </header>
    );
}

export default MarketingHeader;
