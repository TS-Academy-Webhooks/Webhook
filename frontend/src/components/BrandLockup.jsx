import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import "./BrandLockup.css";

/**
 * @param {{ className?: string, markSize?: "compact"|"default"|"large", subtitle?: string, to?: string, ariaLabel?: string }} props
 */
export function BrandLockup({
    className = "",
    markSize = "default",
    subtitle,
    to = "/",
    ariaLabel = "Waybridge home",
}) {
    return (
        <Link className={`brand-lockup ${className}`.trim()} to={to} aria-label={ariaLabel}>
            <BrandMark size={markSize} />
            <span className="brand-lockup__copy">
                <strong>Waybridge</strong>
                {subtitle && <small>{subtitle}</small>}
            </span>
        </Link>
    );
}

export default BrandLockup;
