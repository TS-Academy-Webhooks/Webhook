// src/components/common/Modal.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {string} title
 * @param {React.ReactNode} children
 */
export function Modal({ isOpen, onClose, title, children }) {
    const dialogRef = useRef(null);
    const previouslyFocusedRef = useRef(null);

    // Open/close lifecycle: remember what was focused, move focus into the
    // dialog, and restore focus to the trigger element on close.
    useEffect(() => {
        if (!isOpen) return;

        previouslyFocusedRef.current = document.activeElement;

        const dialog = dialogRef.current;
        const firstFocusable = dialog?.querySelector(FOCUSABLE_SELECTOR);
        (firstFocusable || dialog)?.focus();

        return () => {
            previouslyFocusedRef.current?.focus?.();
        };
    }, [isOpen]);

    // Escape to close, and Tab trapped within the dialog.
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusable = Array.from(
                dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div
                ref={dialogRef}
                className="modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                <div className="modal__header">
                    <h2 id="modal-title" className="modal__title">
                        {title}
                    </h2>
                    <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <div className="modal__body">{children}</div>
            </div>
        </div>,
        document.body
    );
}