import "./BrandMark.css";

const SIZE_CLASSES = {
    compact: "brand-mark--compact",
    default: "brand-mark--default",
    large: "brand-mark--large",
};

/**
 * @param {{ size?: "compact"|"default"|"large", className?: string }} props
 */
export function BrandMark({ size = "default", className = "" }) {
    const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.default;
    return (
        <span
            className={`waybridge-mark ${sizeClass} ${className}`.trim()}
            aria-hidden="true"
        >
            W
        </span>
    );
}

export default BrandMark;
