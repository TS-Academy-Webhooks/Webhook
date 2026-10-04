import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getEvents, getEventsForShipment } from '../services/eventService';
import { WEBHOOK_EVENT_VALUES } from '../constants/webhookEvents';
import { formatDate } from '../utils/formatDate';
import { formatEventType } from '../utils/formatEventType';
import { Pagination } from '../components/common/Pagination';
import { Loader } from '../components/common/Loader';

export default function Events() {
    const [params, setParams] = useSearchParams(); const shipmentId = params.get('shipmentId');
    const [type, setType] = useState(''); const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    useEffect(() => { let alive = true; setLoading(true); setError('');
        const load = shipmentId ? getEventsForShipment(shipmentId).then((items) => ({ items: items.filter((e) => (!type || e.type === type) && (!search || e.eventId?.toLowerCase().includes(search.toLowerCase()))), pagination: { page, limit: 10, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / 10)) } })) : getEvents({ page, limit: 10, type: type || undefined, search: search || undefined });
        load.then((value) => alive && setData(shipmentId ? { ...value, items: value.items.slice((page - 1) * 10, page * 10) } : value)).catch((e) => alive && setError(e.message)).finally(() => alive && setLoading(false)); return () => { alive = false; };
    }, [shipmentId, page, type, search]);
    return <section className="feature-page"><header className="feature-page__header"><div><h1>Webhook events</h1><p className="feature-page__muted">Inspect shipment events and their delivery records.</p></div>{shipmentId && <button onClick={() => { setParams({}); setPage(1); }}>Clear shipment filter</button>}</header>
        <div className="feature-page__toolbar"><input placeholder="Search event ID" aria-label="Search event ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /><select value={type} aria-label="Filter event type" onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">All event types</option>{WEBHOOK_EVENT_VALUES.filter((v) => v.startsWith('shipment.')).map((v) => <option key={v} value={v}>{formatEventType(v)}</option>)}</select></div>
        {error && <p role="alert" className="feature-page__error">{error}</p>}{loading ? <Loader showLabel label="Loading events" /> : <><div className="feature-page__table"><table><thead><tr><th>Event ID</th><th>Event type</th><th>Shipment</th><th>Status</th><th>Created</th></tr></thead><tbody>{data.items.map((event) => <tr key={event.id}><td><Link to={`/events/${event.id}`}>{event.eventId ?? event.id}</Link></td><td>{formatEventType(event.type)}</td><td>{event.shipment?.trackingNumber ?? event.shipment?._id ?? '—'}</td><td>{event.payload?.status ?? '—'}</td><td>{formatDate(event.createdAt, { withTime: true })}</td></tr>)}</tbody></table></div>{!data.items.length && <p className="feature-page__muted">No events match these filters.</p>}<Pagination pagination={data.pagination} onPageChange={setPage} /></>}
    </section>;
}
