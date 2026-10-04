// src/components/common/Button.jsx
import './Button.css';

/**
 * @param {'primary'|'secondary'|'ghost'|'destructive'} [variant]
 * @param {React.ElementType} [as] - render as a different component, e.g. react-router's Link
 * @param {boolean} [loading] - shows a spinner and disables interaction
 * @param {boolean} [disabled]
 * @param {'button'|'submit'} [type]
 * @param {React.ReactNode} children
 * @param {...any} rest - forwarded to the underlying element (e.g. `to` for Link, `onClick`)
 */
export function Button({
                           variant = 'primary',
                           as: Component = 'button',
                           loading = false,
                           disabled = false,
                           type = 'button',
                           children,
                           onClick,
                           ...rest
                       }) {
    const isNativeButton = Component === 'button';
    const isBlocked = disabled || loading;

    const handleClick = (event) => {
        if (!isNativeButton && isBlocked) {
            event.preventDefault();
            return;
        }
        onClick?.(event);
    };

    return (
        <Component
            // `type` only makes sense on a real <button>; passing it to <Link>
            // would render an invalid DOM attribute.
            {...(isNativeButton ? { type } : {})}
            className={`btn btn--${variant} ${loading ? 'btn--loading' : ''}`}
            disabled={isNativeButton ? isBlocked : undefined}
            aria-disabled={!isNativeButton && isBlocked ? true : undefined}
            aria-busy={loading || undefined}
            onClick={handleClick}
            {...rest}
        >
            {loading && <span className="btn__spinner" aria-hidden="true" />}
            <span className="btn__label">{children}</span>
        </Component>
    );
}