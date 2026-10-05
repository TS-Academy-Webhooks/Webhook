import { useId, useState } from "react";
import "./Input.css";
import "./PasswordInput.css";

export function PasswordInput({
    id,
    label,
    name,
    value,
    onChange,
    autoComplete,
    error,
    className = "",
    ...inputProps
}) {
    const generatedId = useId();
    const [visible, setVisible] = useState(false);
    const inputId = id || name || generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div className={`password-input ${className}`.trim()}>
            {label && <label htmlFor={inputId} className="input-field__label">{label}</label>}
            <div className="password-input__control-wrap">
                <input
                    {...inputProps}
                    id={inputId}
                    className={`input-field__control ${error ? "input-field__control--error" : ""}`}
                    name={name}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    type={visible ? "text" : "password"}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={error ? errorId : inputProps["aria-describedby"]}
                />
                <button
                    className="password-input__toggle"
                    type="button"
                    aria-label={`${visible ? "Hide" : "Show"} ${label?.toLowerCase() || "password"}`}
                    aria-controls={inputId}
                    aria-pressed={visible}
                    onClick={() => setVisible((current) => !current)}
                >
                    {visible ? "Hide" : "Show"}
                </button>
            </div>
            {error && <p id={errorId} className="input-field__error" role="alert">{error}</p>}
        </div>
    );
}

export default PasswordInput;
