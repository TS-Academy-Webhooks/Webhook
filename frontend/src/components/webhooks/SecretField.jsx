// src/components/webhooks/SecretField.jsx
import { useState } from 'react';
import { Button } from '../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './SecretField.css';

/**
 * @param {string} value - full secret, or a masked string like "whsec_abcd****1234"
 * @param {boolean} [oneTime] - true right after creation, where this is the only
 *   time the full secret will ever be shown
 */
export function SecretField({ value, oneTime = false }) {
    const [copied, copy] = useCopyToClipboard();
    const [visible, setVisible] = useState(false);
    const displayValue = oneTime && visible ? value : '•'.repeat(Math.min(value?.length ?? 16, 32));

    return (
        <div className="secret-field">
            {oneTime && (
                <p className="secret-field__notice">
                    This is the only time this secret will be shown. Copy it now and store it
                    with your receiving server's configuration.
                </p>
            )}
            <div className="secret-field__row">
                <code className="secret-field__value">{displayValue}</code>
                {oneTime && (
                    <>
                        <Button variant="secondary" onClick={() => setVisible((shown) => !shown)}>{visible ? 'Hide' : 'Reveal'}</Button>
                        <Button variant="secondary" onClick={() => copy(value)}>{copied ? 'Copied!' : 'Copy'}</Button>
                    </>
                )}
            </div>
        </div>
    );
}
