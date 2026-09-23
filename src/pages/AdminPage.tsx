import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LocalBody, TicketStatus, TicketView } from '../../shared/types';
import { api } from '../lib/api';
import { useOnline } from '../lib/hooks';
import { badgeTone, dueDate, formatDate, issueLabel, priorityLabel, statusLabel } from '../lib/labels';
import { Badge } from '../components/Badge';

const NEXT_LABEL: Record<TicketStatus, string | null> = {
  submitted: '➡️ Assign ticket',
  assigned: '🛠️ Start work',
  in_progress: '✅ Mark resolved',
  resolved: null,
};

const STATUS_ORDER: TicketStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved'];

/**
 * Demo admin "ticket desk" (spec F): shows each report routed to its
 * responsible local body and lets a judge advance the status one step at a time.
 */
export function AdminPage() {
  const [tickets, setTickets] = useState<TicketView[]>([]);
  const [bodies, setBodies] = useState<LocalBody[]>([]);
  const [bodyFilter, setBodyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const online = useOnline();

  const load = useCallback(() => {
    setLoading(true);
    api
      .tickets()
      .then((list) => {
        setTickets(list);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api
      .localBodies()
      .then(setBodies)
      .catch(() => setBodies([]));
  }, [load]);

  const advance = async (id: string): Promise<void> => {
    setBusyId(id);
    try {
      const updated = await api.advanceTicket(id);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const visible = tickets.filter(
    (t) =>
      (bodyFilter === 'all' || t.localBodyId === bodyFilter) &&
      (statusFilter === 'all' || t.status === statusFilter),
  );

  const counts = STATUS_ORDER.map((status) => ({
    status,
    n: tickets.filter((t) => t.status === status).length,
  }));

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="card">
        <div className="admin-head">
          <div>
            <span className="pill sim">SIMULATED ROUTING WORKFLOW</span>
            <h1 style={{ margin: '8px 0 4px', fontSize: 28 }}>Local-body ticket desk (demo admin)</h1>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              Every public report lands here, routed to the local body responsible for that facility. Advance a ticket
              to demonstrate the full status journey.
            </p>
          </div>
          <button type="button" className="btn secondary" onClick={load}>
            ⟳ Refresh
          </button>
        </div>

        <div className="flow-chain" aria-label="Workflow: user report, ticket created, local body identified, ticket routed, status">
          <span className="node">👤 User report</span>
          <span className="arrow" aria-hidden="true">→</span>
          <span className="node">🎫 Ticket created</span>
          <span className="arrow" aria-hidden="true">→</span>
          <span className="node">🏛️ Local body identified</span>
          <span className="arrow" aria-hidden="true">→</span>
          <span className="node">📦 Ticket routed</span>
          <span className="arrow" aria-hidden="true">→</span>
          <span className="node">📊 Status</span>
        </div>

        <div className="stat-row">
          {counts.map(({ status, n }) => {
            const label = statusLabel(status);
            return (
              <div className="stat" key={status}>
                <b>{n}</b>
                <span>
                  <span aria-hidden="true">{label.glyph}</span> {label.text}
                </span>
              </div>
            );
          })}
        </div>

        <div className="admin-filters">
          <label>
            Filter by local body
            <select value={bodyFilter} onChange={(e) => setBodyFilter(e.target.value)}>
              <option value="all">All local bodies</option>
              {bodies.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filter by status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | TicketStatus)}>
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s).text}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!online && (
          <div className="notice warn" role="status">
            <b>Offline mode</b> — showing the last list loaded on this device. Status changes need a connection.
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="ticket-list" aria-live="polite">
        {loading && <div className="card empty-state">Loading tickets…</div>}

        {!loading && visible.length === 0 && (
          <div className="card empty-state">
            <p>No tickets match these filters.</p>
            <Link className="btn" to="/">
              Report a problem from the map →
            </Link>
          </div>
        )}

        {visible.map((t) => {
          const status = statusLabel(t.status);
          const issue = issueLabel(t.issue);
          const priority = priorityLabel(t.priority);
          const nextLabel = NEXT_LABEL[t.status];
          return (
            <article className="card ticket-card" key={t.id}>
              <div className="ticket-top">
                <span className="tid">{t.id}</span>
                <Badge tone={badgeTone('status', t.status)} glyph={status.glyph}>
                  {status.text}
                </Badge>
                <Badge tone={badgeTone('priority', t.priority)} glyph={priority.glyph}>
                  {priority.text}
                </Badge>
                <Badge tone="info" glyph="🏛️">
                  {t.localBodyName}
                </Badge>
              </div>

              <h3>
                <span aria-hidden="true">{t.facilityType === 'toilet' ? '🚻' : '💧'}</span>{' '}
                <Link to={`/facility/${t.facilityId}`}>{t.facilityName}</Link>
              </h3>
              <p className="desc">
                <b>
                  Issue: {issue.glyph} {issue.text}
                </b>
                {t.description ? ` — “${t.description}”` : ''}
              </p>

              <dl className="kv">
                <dt>Created</dt>
                <dd>{formatDate(t.createdAt)}</dd>
                <dt>Response due</dt>
                <dd>
                  {dueDate(t.createdAt, t.slaHours)} ({t.slaHours} h)
                </dd>
                <dt>Jurisdiction</dt>
                <dd>{t.jurisdiction}</dd>
                <dt>Last change</dt>
                <dd>{formatDate(t.updatedAt)}</dd>
              </dl>

              <div className="ticket-actions">
                {nextLabel ? (
                  <button
                    type="button"
                    className="btn small"
                    disabled={!online || busyId === t.id}
                    onClick={() => void advance(t.id)}
                  >
                    {busyId === t.id ? 'Updating…' : nextLabel}
                  </button>
                ) : (
                  <span className="badge ok">
                    <span className="glyph" aria-hidden="true">
                      ✔
                    </span>
                    Journey complete
                  </span>
                )}
                <Link className="btn small secondary" to={`/ticket/${t.id}`}>
                  View confirmation
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="privacy-note" style={{ marginBottom: 24 }}>
        <b>🔒 Privacy in the admin view</b>
        Tickets carry only facility, issue, description, priority, status and timestamps. Reporter identity and
        location history are never collected, so they cannot be shown here — by anyone.
      </div>
    </div>
  );
}
