import { Link } from "react-router-dom";
import "./MarketingHome.css";

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="brand-mark"
      viewBox="0 0 40 40"
      fill="none"
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path
        d="M9 27V22a11 11 0 0 1 22 0v5M6 28h28M13 28v-4m14 4v-4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarketingHome() {
  return (
    <div className="waybridge-marketing">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="marketing-header">
        <Link className="wordmark" to="/" aria-label="Waybridge home">
          <BrandMark />
          <span>Waybridge</span>
        </Link>

        <nav className="marketing-nav" aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#workflow">How it works</a>
          <Link to="/about">About</Link>
          <Link to="/docs">API docs</Link>
          <Link to="/track">Track</Link>
        </nav>

        <div className="header-actions">
          <Link className="text-link" to="/login">
            Sign in
          </Link>
          <Link className="button-link button-link-primary" to="/signup">
            Get started
          </Link>
        </div>
      </header>

      <main id="main-content">
        <section className="marketing-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">LOGISTICS WEBHOOK MANAGEMENT</p>
            <h1 id="hero-title">Logistics events, delivered with clarity.</h1>
            <p className="hero-description">
              Waybridge gives your team one place to manage webhooks, follow
              shipment event deliveries, and review retry history.
            </p>
            <div className="hero-actions">
              <Link className="button-link button-link-primary" to="/signup">
                Create your account
              </Link>
              <a className="button-link button-link-secondary" href="#platform">
                Explore the platform
              </a>
            </div>
            <p className="hero-note">
              A clearer view of every event from dispatch to delivery.
            </p>
          </div>

          <section
            className="activity-card"
            aria-labelledby="activity-title"
          >
            <div className="activity-card-header">
              <div>
                <p className="card-kicker">DELIVERY ACTIVITY</p>
                <h2 id="activity-title">Recent webhook events</h2>
              </div>
              <span className="activity-indicator">Example</span>
            </div>

            <ul className="activity-list">
              <li>
                <span className="event-symbol event-symbol-purple" aria-hidden="true">
                  01
                </span>
                <span className="event-name">
                  <strong>shipment.picked_up</strong>
                  <span>Shipment event</span>
                </span>
                <span className="delivery-status status-delivered">Delivered</span>
              </li>
              <li>
                <span className="event-symbol event-symbol-blue" aria-hidden="true">
                  02
                </span>
                <span className="event-name">
                  <strong>shipment.delivery_failed</strong>
                  <span>Shipment event</span>
                </span>
                <span className="delivery-status status-failed">Failed</span>
              </li>
              <li>
                <span className="event-symbol event-symbol-green" aria-hidden="true">
                  03
                </span>
                <span className="event-name">
                  <strong>shipment.out_for_delivery</strong>
                  <span>Shipment event</span>
                </span>
                <span className="delivery-status status-pending">Pending</span>
              </li>
            </ul>

            <p className="activity-caption">
              Illustrative events. Review delivery status and attempts in one
              workspace.
            </p>
          </section>
        </section>

        <section
          className="platform-section"
          id="platform"
          aria-labelledby="platform-title"
        >
          <div className="section-heading">
            <p className="eyebrow">A PRACTICAL VIEW OF WEBHOOKS</p>
            <h2 id="platform-title">
              From webhook setup to delivery history.
            </h2>
            <p>
              Bring the key parts of logistics event delivery together, so your
              team can see what happened and decide what to do next.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h3>Manage webhook endpoints</h3>
              <p>
                Keep event subscriptions and webhook destinations organized
                for your logistics workflows.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-number">02</span>
              <h3>Monitor every delivery</h3>
              <p>
                Check event status, timestamps, and delivery attempts from a
                single activity view.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-number">03</span>
              <h3>Investigate event history</h3>
              <p>
                Follow shipment events and inspect failed deliveries to
                troubleshoot integrations with more context.
              </p>
            </article>
          </div>
        </section>

        <section
          className="workflow-section"
          id="workflow"
          aria-labelledby="workflow-title"
        >
          <div className="workflow-copy">
            <p className="eyebrow">HOW WAYBRIDGE WORKS</p>
            <h2 id="workflow-title">Keep the delivery flow visible.</h2>
            <p>
              Waybridge connects webhook configuration with the event and
              delivery history your team needs to troubleshoot.
            </p>
          </div>
          <ol className="workflow-steps">
            <li>
              <span>1</span>
              <div>
                <h3>Connect your webhook</h3>
                <p>Choose the logistics events your system needs to receive.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Follow event delivery</h3>
                <p>See delivery status and attempts as events move through.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Review and troubleshoot</h3>
                <p>Use delivery and event history to investigate failures.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="closing-cta" aria-labelledby="cta-title">
          <div>
            <p className="eyebrow">WAYBRIDGE</p>
            <h2 id="cta-title">Move logistics events forward.</h2>
            <p>
              Bring webhook management and delivery visibility into one
              workspace.
            </p>
          </div>
          <Link className="button-link button-link-light" to="/signup">
            Get started
          </Link>
        </section>
      </main>

      <footer className="marketing-footer">
        <Link className="wordmark footer-wordmark" to="/">
          <BrandMark />
          <span>Waybridge</span>
        </Link>
        <p>Logistics webhook management and delivery visibility.</p>
        <div>
          <Link to="/login">Sign in</Link>
          <Link to="/about">About</Link>
          <Link to="/docs">API docs</Link>
          <Link to="/track">Track a shipment</Link>
          <Link to="/signup">Create an account</Link>
        </div>
      </footer>
    </div>
  );
}

export default MarketingHome;
