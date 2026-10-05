import { Link } from "react-router-dom";
import { MarketingShell } from "../components/marketing/MarketingShell";

const endpoints = [
    ["POST", "/api/auth/login", "Sign in and receive an in-memory access token plus an HttpOnly refresh cookie."],
    ["POST", "/api/auth/refresh", "Rotate the refresh session and receive a new short-lived access token."],
    ["GET", "/api/shipments?page=1&limit=20", "List shipments visible to the signed-in customer or administrator."],
    ["POST", "/api/shipments", "Create a shipment from an origin, destination, and non-negative amount."],
    ["GET", "/api/tracking/:trackingNumber", "Publicly read shipment status and its status timeline."],
    ["GET", "/api/webhooks?page=1&limit=10", "List owned webhooks (or all webhooks for administrators); secrets are masked."],
    ["POST", "/api/webhooks/:id/test", "Queue one `webhook.test` delivery for an active endpoint."],
    ["GET", "/api/deliveries?page=1&limit=20", "List delivery summaries with status and attempt counts."],
];

export default function Docs() {
    return (
        <MarketingShell>
            <div className="public-page public-page__docs-page">
                <header>
                    <p className="public-page__eyebrow">Developer guide</p>
                    <h1>Connect shipment updates to your systems.</h1>
                    <p className="public-page__lead">
                        Waybridge exposes a JSON API for shipment tracking, webhook subscriptions, and delivery history. API paths below are rooted at <code>/api</code>.
                    </p>
                </header>

                <div className="public-page__docs">
                    <nav className="public-page__toc" aria-label="Documentation sections">
                        <a href="#session">Session &amp; roles</a>
                        <a href="#shipments">Shipments &amp; tracking</a>
                        <a href="#webhooks">Webhooks</a>
                        <a href="#deliveries">Events &amp; deliveries</a>
                        <a href="#signature">Signature verification</a>
                    </nav>

                    <div className="public-page__docs-content">
                        <section className="public-page__docs-section" id="session">
                            <h2>Session &amp; roles</h2>
                            <p>Successful responses use a <code>success</code>, <code>message</code>, and <code>data</code> envelope. Send the short-lived access token as a Bearer token. The browser client keeps it in memory and sends credentials for refresh/logout; the refresh cookie is HttpOnly.</p>
                            <p>Customers see their assigned shipments, owned webhooks, and deliveries. Administrators can inspect platform-wide events and operate the demo receiver.</p>
                            <div className="public-page__code">{"POST /api/auth/login\nPOST /api/auth/refresh\nPOST /api/auth/logout\nGET  /api/auth/me"}</div>
                        </section>

                        <section className="public-page__docs-section" id="shipments">
                            <h2>Shipments &amp; tracking</h2>
                            <p>Create shipments with an origin, destination, and amount. Public tracking looks up a case-insensitive tracking number and returns status history without private customer data.</p>
                            <div className="public-page__code">{"POST /api/shipments\n{\n  \"origin\": \"Oakland, CA\",\n  \"destination\": \"Portland, OR\",\n  \"amount\": 128.50\n}\n\nGET /api/tracking/TRK-00001"}</div>
                            <p>Valid status changes follow the shipment workflow; only administrators can apply status transitions.</p>
                        </section>

                        <section className="public-page__docs-section" id="webhooks">
                            <h2>Webhook subscriptions</h2>
                            <p>Subscribe to supported <code>shipment.*</code> events or use <code>*</code> for all supported shipment events. Configure an HTTP(S) URL without embedded credentials; production endpoints must use HTTPS. Full secrets are returned only when a webhook is created or its secret is regenerated.</p>
                            <div className="public-page__code">{"POST /api/webhooks\n{\n  \"name\": \"Warehouse updates\",\n  \"url\": \"https://example.com/hooks/waybridge\",\n  \"events\": [\"shipment.delivered\", \"shipment.delivery_failed\"]\n}"}</div>
                        </section>

                        <section className="public-page__docs-section" id="deliveries">
                            <h2>Events &amp; deliveries</h2>
                            <p>Event and delivery lists use <code>data.items</code> plus pagination metadata. Delivery summaries include an attempt count; each delivery detail page exposes the individual attempt history. Failed deliveries can be queued for a manual resend.</p>
                            <ul>
                                {endpoints.map(([method, path, description]) => (
                                    <li key={`${method}-${path}`}><code>{method} {path}</code> — {description}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="public-page__docs-section" id="signature">
                            <h2>Verify webhook signatures</h2>
                            <p>The request body is the exact JSON serialization of the event payload. Verify its raw bytes before parsing; re-serializing a parsed object can change the bytes covered by the signature.</p>
                            <div className="public-page__code">{"rawRequestBody = readRawRequestBytes()\nsignature = HMAC_SHA256(secret, rawRequestBody)\n\nX-Webhook-Signature: <64 lowercase hex characters>"}</div>
                            <p>Compare the expected and received digests with a constant-time comparison. This API does not add a timestamp or a <code>sha256=</code> prefix to the outgoing signature. The <Link className="public-page__link" to="/tools/demo-receiver">demo receiver</Link> is available after signing in. Explore the <a className="public-page__link" href="/api-docs/">interactive API reference</a> for endpoint schemas.</p>
                        </section>
                    </div>
                </div>
            </div>
        </MarketingShell>
    );
}
