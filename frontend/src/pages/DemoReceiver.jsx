import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Loader } from "../components/common/Loader";
import { Modal } from "../components/common/Modal";
import { useAuth } from "../hooks/useAuth";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import {
    clearDemoReceiverHistory,
    getDemoReceiverConfiguration,
    getDemoReceiverHistory,
    resetDemoReceiverConfiguration,
    updateDemoReceiverConfiguration,
} from "../services/demoReceiverService";
import { formatDate } from "../utils/formatDate";
import { Pagination } from "../components/common/Pagination";
import "./DemoReceiver.css";

function getReceiverUrl() {
    if (import.meta.env.DEV) return "http://localhost:3000/api/demo-receiver";
    if (typeof window !== "undefined") return new URL("/api/demo-receiver", window.location.origin).href;
    return "/api/demo-receiver";
}

function stringifyBody(body) {
    return body === undefined ? "" : JSON.stringify(body, null, 2);
}

export default function DemoReceiver() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const eventFilter = searchParams.get("event") || "";
    const rawSignatureFilter = searchParams.get("signatureValid") || "";
    const signatureFilter = ["true", "false", "unknown"].includes(rawSignatureFilter)
        ? rawSignatureFilter
        : "";
    const [copied, copy] = useCopyToClipboard();
    const [history, setHistory] = useState(null);
    const [profiles, setProfiles] = useState({ success: null, failure: null });
    const [loading, setLoading] = useState(isAdmin);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyProfile, setBusyProfile] = useState("");
    const [confirmAction, setConfirmAction] = useState("");

    const load = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        setError("");
        try {
            const [nextHistory, nextConfiguration] = await Promise.all([
                getDemoReceiverHistory({
                    page,
                    limit: 20,
                    event: eventFilter,
                    signatureValid: signatureFilter,
                }),
                getDemoReceiverConfiguration(),
            ]);
            setHistory(nextHistory);
            setProfiles({
                success: {
                    statusCode: nextConfiguration.success?.statusCode ?? 201,
                    body: stringifyBody(nextConfiguration.success?.body),
                },
                failure: {
                    statusCode: nextConfiguration.failure?.statusCode ?? 500,
                    body: stringifyBody(nextConfiguration.failure?.body),
                },
            });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [eventFilter, isAdmin, page, signatureFilter]);

    useEffect(() => { void load(); }, [load]);

    function updateFilter(key, value) {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete("page");
        setSearchParams(next);
    }

    function updateProfile(name, key, value) {
        setProfiles((current) => ({
            ...current,
            [name]: { ...current[name], [key]: value },
        }));
    }

    async function saveProfile(name) {
        const profile = profiles[name];
        const statusCode = Number(profile.statusCode);
        if (
            !Number.isInteger(statusCode) ||
            (name === "success" && (statusCode < 200 || statusCode > 299)) ||
            (name === "failure" && (statusCode < 400 || statusCode > 599))
        ) {
            setNotice(name === "success" ? "Success status must be between 200 and 299." : "Failure status must be between 400 and 599.");
            return;
        }

        let body;
        try {
            if (profile.body.trim()) body = JSON.parse(profile.body);
        } catch {
            setNotice("Response body must be valid JSON.");
            return;
        }

        setBusyProfile(name);
        setNotice("");
        try {
            const update = { statusCode, ...(profile.body.trim() ? { body } : {}) };
            const next = await updateDemoReceiverConfiguration({ [name]: update });
            setProfiles({
                success: {
                    statusCode: next.success?.statusCode ?? 201,
                    body: stringifyBody(next.success?.body),
                },
                failure: {
                    statusCode: next.failure?.statusCode ?? 500,
                    body: stringifyBody(next.failure?.body),
                },
            });
            setNotice(`${name === "success" ? "Success" : "Failure"} response profile saved.`);
        } catch (requestError) {
            setNotice(requestError.message);
        } finally {
            setBusyProfile("");
        }
    }

    async function runConfirmedAction() {
        setBusyProfile("action");
        setNotice("");
        try {
            if (confirmAction === "clear") {
                await clearDemoReceiverHistory();
                setNotice("Demo receiver history cleared.");
            } else if (confirmAction === "reset") {
                await resetDemoReceiverConfiguration();
                setNotice("Response profiles restored to defaults.");
            }
            setConfirmAction("");
            await load();
        } catch (requestError) {
            setNotice(requestError.message);
        } finally {
            setBusyProfile("");
        }
    }

    const url = getReceiverUrl();
    return (
        <section className="feature-page demo-receiver-page">
            <header className="feature-page__header">
                <div>
                    <h1>Demo receiver</h1>
                    <p className="feature-page__muted">Send webhook requests to a safe receiver while you validate your integration.</p>
                </div>
            </header>

            <section className="feature-page__panel">
                <h2>Receiver URL</h2>
                <p className="feature-page__muted">Use this public POST endpoint as a webhook URL. Append <code>/fail</code> to deliberately test a failing response.</p>
                <div className="demo-receiver-url">
                    <code>{url}</code>
                    <Button variant="secondary" onClick={() => copy(url)}>{copied ? "Copied!" : "Copy URL"}</Button>
                </div>
                <div className="demo-receiver-links">
                    <Link to="/webhooks/new">Create a test webhook</Link>
                    <Link to="/deliveries">View deliveries</Link>
                </div>
                <p className="feature-page__demo-note">The receiver stores up to 100 requests in memory and resets its history and profiles when the backend restarts. In production, the backend must enable <code>ENABLE_DEMO_RECEIVER=true</code>.</p>
            </section>

            {!isAdmin ? (
                <p className="feature-page__notice">Admin access is required to inspect captured requests, clear history, or change response profiles. Your webhook delivery status remains available on the Deliveries page.</p>
            ) : loading ? (
                <Loader label="Loading receiver controls" showLabel />
            ) : error ? (
                <div className="feature-page__error" role="alert">
                    <p>{error}</p>
                    {error.toLowerCase().includes("not found") && <p>Enable the demo receiver in the backend environment to use these controls.</p>}
                    <Button variant="ghost" onClick={() => void load()}>Retry</Button>
                </div>
            ) : (
                <>
                    {notice && <p className="feature-page__notice" role="status" aria-live="polite">{notice}</p>}
                    <div className="demo-receiver-profiles">
                        {["success", "failure"].map((name) => (
                            <form
                                className="feature-page__panel feature-page__form"
                                key={name}
                                onSubmit={(event) => { event.preventDefault(); void saveProfile(name); }}
                            >
                                <h2>{name === "success" ? "Success response" : "Failure response"}</h2>
                                <label>
                                    HTTP status
                                    <input
                                        type="number"
                                        name={`${name}-status-code`}
                                        min={name === "success" ? 200 : 400}
                                        max={name === "success" ? 299 : 599}
                                        value={profiles[name]?.statusCode ?? ""}
                                        onChange={(event) => updateProfile(name, "statusCode", event.target.value)}
                                    />
                                </label>
                                <label>
                                    JSON body (optional)
                                    <textarea
                                        name={`${name}-body`}
                                        value={profiles[name]?.body ?? ""}
                                        onChange={(event) => updateProfile(name, "body", event.target.value)}
                                        placeholder='{"success": true, "message": "Received"}'
                                        spellCheck={false}
                                    />
                                </label>
                                <Button type="submit" loading={busyProfile === name}>Save profile</Button>
                            </form>
                        ))}
                    </div>
                    <div className="demo-receiver-toolbar">
                        <h2>Captured requests</h2>
                        <Button variant="destructive" onClick={() => setConfirmAction("clear")} disabled={!history?.items.length}>Clear history</Button>
                    </div>
                    <div className="feature-page__toolbar demo-receiver-filters">
                        <label>
                            <span className="sr-only">Filter requests by event type</span>
                            <input type="search" value={eventFilter} maxLength={100} onChange={(event) => updateFilter("event", event.target.value)} placeholder="Filter by exact event type…" autoComplete="off" />
                        </label>
                        <label>
                            <span className="sr-only">Filter requests by signature validity</span>
                            <select value={signatureFilter} onChange={(event) => updateFilter("signatureValid", event.target.value)}>
                                <option value="">All signature results</option>
                                <option value="true">Valid</option>
                                <option value="false">Invalid</option>
                                <option value="unknown">Unknown</option>
                            </select>
                        </label>
                        <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
                    </div>
                    {history?.items.length ? (
                        <>
                            <div className="feature-page__table">
                                <table>
                                    <thead><tr><th scope="col">Received</th><th scope="col">Event</th><th scope="col">Signature</th><th scope="col">Payload</th></tr></thead>
                                    <tbody>
                                        {history.items.map((request) => (
                                            <tr key={request.id ?? request._id}>
                                                <td>{formatDate(request.receivedAt ?? request.createdAt, { withTime: true })}</td>
                                                <td>{request.event ?? request.eventType ?? "—"}</td>
                                                <td>{request.signature?.status ?? (request.signatureValid === true ? "valid" : request.signatureValid === false ? "invalid" : "unknown")}</td>
                                                <td><details><summary>View request</summary><pre className="feature-page__code">{JSON.stringify(request.body ?? {}, null, 2)}</pre>{request.bodyTruncated && <p className="feature-page__muted">The stored preview was truncated to the receiver limit.</p>}</details></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination pagination={history.pagination} onPageChange={(nextPage) => {
                                const next = new URLSearchParams(searchParams);
                                next.set("page", String(nextPage));
                                setSearchParams(next);
                            }} />
                        </>
                    ) : <p className="feature-page__muted">No requests match these filters yet.</p>}
                    <div className="demo-receiver-reset">
                        <Button variant="ghost" onClick={() => setConfirmAction("reset")}>Restore default response profiles</Button>
                    </div>
                </>
            )}

            <Modal
                isOpen={Boolean(confirmAction)}
                onClose={() => busyProfile !== "action" && setConfirmAction("")}
                title={confirmAction === "clear" ? "Clear captured requests?" : "Restore default profiles?"}
            >
                <p>{confirmAction === "clear" ? "This permanently removes the in-memory request history." : "This replaces both configured response profiles with the backend defaults."}</p>
                <div className="feature-page__form-actions">
                    <Button variant="secondary" onClick={() => setConfirmAction("")} disabled={busyProfile === "action"}>Cancel</Button>
                    <Button variant="destructive" onClick={() => void runConfirmedAction()} loading={busyProfile === "action"}>Confirm</Button>
                </div>
            </Modal>
        </section>
    );
}
