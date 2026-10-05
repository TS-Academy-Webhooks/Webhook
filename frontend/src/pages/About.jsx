import { Link } from "react-router-dom";
import { MarketingShell } from "../components/marketing/MarketingShell";

const principles = [
    {
        number: "01",
        title: "Keep shipment context together",
        text: "A status and its history belong in the same place, so teams can see what changed without piecing together separate updates.",
    },
    {
        number: "02",
        title: "Make system hand-offs visible",
        text: "Shipment events can notify the services that depend on them, while delivery summaries and attempts show whether those signals arrived.",
    },
    {
        number: "03",
        title: "Give every role a useful view",
        text: "Customers follow the shipments assigned to them; administrators can manage shared operations and inspect platform-wide events.",
    },
];

export default function About() {
    return (
        <MarketingShell>
            <div className="public-page">
                <section className="public-page__hero" aria-labelledby="about-heading">
                    <div>
                        <p className="public-page__eyebrow">About Waybridge</p>
                        <h1 id="about-heading">A clearer connection between shipment progress and the systems around it.</h1>
                        <p className="public-page__lead">
                            Waybridge brings tracking, webhook management, and delivery history into one practical workspace for logistics teams and the people they serve.
                        </p>
                    </div>
                    <aside className="public-page__journey" aria-label="How shipment updates flow">
                        <h2>One movement, useful signals</h2>
                        <ol>
                            <li><span>1</span><div><strong>A shipment changes</strong><small>Status history records each hand-off.</small></div></li>
                            <li><span>2</span><div><strong>Subscribers are notified</strong><small>Selected events are delivered to active endpoints.</small></div></li>
                            <li><span>3</span><div><strong>Outcomes stay inspectable</strong><small>Summaries and attempts make follow-up easier.</small></div></li>
                        </ol>
                    </aside>
                </section>

                <section className="public-page__section" aria-labelledby="principles-heading">
                    <div>
                        <p className="public-page__eyebrow">Our approach</p>
                        <h2 id="principles-heading">Less chasing. More context.</h2>
                    </div>
                    <div className="public-page__cards">
                        {principles.map((principle) => (
                            <article className="public-page__card" key={principle.number}>
                                <span className="public-page__eyebrow">{principle.number}</span>
                                <h3>{principle.title}</h3>
                                <p>{principle.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="public-page__section public-page__callout">
                    <div>
                        <h2>See the shipment experience for yourself.</h2>
                        <p>Look up a tracking number or explore the API contract.</p>
                    </div>
                    <div className="public-page__actions">
                        <Link to="/track">Track a shipment</Link>
                        <Link to="/docs">Read the API docs</Link>
                    </div>
                </section>
            </div>
        </MarketingShell>
    );
}
