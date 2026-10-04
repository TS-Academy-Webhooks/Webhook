import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export function WebhookPayloadViewer({ payload }) {
    const [copied, copy] = useCopyToClipboard();
    const json = JSON.stringify(payload ?? {}, null, 2);
    return <div className="webhook-payload"><div className="webhook-payload__toolbar"><span>JSON payload</span><button type="button" onClick={() => copy(json)}>{copied ? 'Copied' : 'Copy payload'}</button></div><pre className="feature-page__code" tabIndex="0" aria-label="Webhook JSON payload">{json}</pre></div>;
}
