// src/components/common/Input.jsx
import { useId } from 'react';
import './Input.css';

/**
 * @param {string} [label] - visible label; omit for a bare input (still pass aria-label)
 * @param {string} [error] - validation message shown below the input
 * @param {string} [id] - pass your own id if you need to reference it elsewhere
 * @param {...any} rest - value, onChange, placeholder, type, aria-label, etc.
 */
export function Input({ label, error, id, ...rest }) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div className="input-field">
            {label && (
                <label htmlFor={inputId} className="input-field__label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`input-field__control ${error ? 'input-field__control--error' : ''}`}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                {...rest}
            />
            {error && (
                <p id={errorId} className="input-field__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}