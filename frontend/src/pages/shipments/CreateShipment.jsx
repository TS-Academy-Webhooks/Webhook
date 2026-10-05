import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";
import { createShipment } from "../../services/shipmentService";
import { ROUTES } from "../../constants/routes";
import "./Shipments.css";

export default function CreateShipment() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === "admin";
    const [fields, setFields] = useState({
        origin: "",
        destination: "",
        amount: "",
        customer: "",
        customerId: "",
        note: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function updateField(event) {
        setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
        setFieldErrors((current) => ({ ...current, [event.target.name]: undefined }));
    }

    function focusFirstError(errors) {
        document.getElementById(`shipment-${Object.keys(errors)[0]}`)?.focus();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const errors = {};
        if (!fields.origin.trim()) errors.origin = "Origin is required.";
        if (!fields.destination.trim()) errors.destination = "Destination is required.";
        if (isAdmin && !fields.customer.trim()) errors.customer = "Customer name is required for administrator-created shipments.";
        if (isAdmin && fields.customerId.trim() && !/^[\da-f]{24}$/i.test(fields.customerId.trim())) {
            errors.customerId = "Enter a valid 24-character customer ID.";
        }
        if (fields.amount.trim() === "" || !Number.isFinite(Number(fields.amount)) || Number(fields.amount) < 0) {
            errors.amount = "Enter an amount of zero or greater.";
        }
        if (fields.note.length > 500) errors.note = "Notes must be 500 characters or fewer.";
        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            focusFirstError(errors);
            return;
        }

        setSubmitting(true);
        setError("");
        setFieldErrors({});
        const payload = {
            origin: fields.origin.trim(),
            destination: fields.destination.trim(),
            amount: Number(fields.amount),
            ...(fields.note.trim() ? { note: fields.note.trim() } : {}),
            ...(isAdmin ? {
                customer: fields.customer.trim(),
                ...(fields.customerId.trim() ? { customerId: fields.customerId.trim() } : {}),
            } : {}),
        };

        try {
            const shipment = await createShipment(payload);
            navigate(ROUTES.SHIPMENT_DETAILS(shipment.id), { state: { created: true } });
        } catch (requestError) {
            setError(requestError.message);
            const serverFieldErrors = requestError.fieldErrors ?? {};
            setFieldErrors(serverFieldErrors);
            if (Object.keys(serverFieldErrors).length > 0) focusFirstError(serverFieldErrors);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="feature-page">
            <header className="feature-page__header">
                <div>
                    <p><Link to="/shipments">Shipments</Link></p>
                    <h1>New shipment</h1>
                    <p className="feature-page__muted">Create a shipment and generate a public tracking number.</p>
                </div>
            </header>
            <form className="feature-page__form shipment-form" onSubmit={handleSubmit} noValidate>
                {error && <p className="feature-page__error" role="alert">{error}</p>}
                {isAdmin && (
                    <>
                        <Input id="shipment-customer" label="Customer name" name="customer" autoComplete="off" value={fields.customer} onChange={updateField} error={fieldErrors.customer} placeholder="Customer account name…" />
                        <Input id="shipment-customerId" label="Customer ID (optional)" name="customerId" autoComplete="off" spellCheck={false} maxLength={24} value={fields.customerId} onChange={updateField} error={fieldErrors.customerId} placeholder="24-character customer ID…" />
                    </>
                )}
                <div className="shipment-form__columns">
                    <Input id="shipment-origin" label="Origin" name="origin" autoComplete="off" value={fields.origin} onChange={updateField} error={fieldErrors.origin} placeholder="Starting location…" />
                    <Input id="shipment-destination" label="Destination" name="destination" autoComplete="off" value={fields.destination} onChange={updateField} error={fieldErrors.destination} placeholder="Delivery location…" />
                </div>
                <Input id="shipment-amount" label="Amount" name="amount" type="number" inputMode="decimal" min="0" step="any" autoComplete="off" value={fields.amount} onChange={updateField} error={fieldErrors.amount} placeholder="125.50…" />
                <label className="shipment-form__note" htmlFor="shipment-note">
                    Event note (optional)
                    <textarea id="shipment-note" name="note" maxLength={500} autoComplete="off" value={fields.note} onChange={updateField} aria-invalid={Boolean(fieldErrors.note) || undefined} aria-describedby={fieldErrors.note ? "shipment-note-error" : undefined} placeholder="Add context for the shipment.created event…" />
                    {fieldErrors.note && <span id="shipment-note-error" className="shipment-form__field-error" role="alert">{fieldErrors.note}</span>}
                </label>
                <div className="feature-page__form-actions">
                    <Button as={Link} to={ROUTES.SHIPMENTS} variant="ghost" disabled={submitting}>Cancel</Button>
                    <Button type="submit" loading={submitting}>Create shipment</Button>
                </div>
            </form>
        </section>
    );
}
