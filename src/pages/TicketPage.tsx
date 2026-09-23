import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { TicketView, WorkflowStep } from '../../shared/types';
import { api } from '../lib/api';
import { badgeTone, dueDate, formatDate, issueLabel, priorityLabel, statusLabel } from '../lib/labels';
import { Badge } from '../components/Badge';
import { Stepper } from '../components/Stepper';

/** Confirmation screen after a report is filed (spec E.7 + F). */
export function TicketPage() {
  const { id = '' } = useParams();
  const [ticket, setTicket] = useState<TicketView | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .ticket(id)
      .then((res) => {
        if (!cancelled) {
          setTicket(res.ticket);
          setWorkflow(res.workflow);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ticket could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="card empty-state">
          <p role="alert">{error}</p>
          <Link className="btn" to="/">
            ← Back to the map
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="card empty-state">Loading ticket…</div>
      </div>
    );
  }

  const status = statusLabel(ticket.status);
  const issue = issueLabel(ticket.issue);
  const priority = priorityLabel(ticket.priority);

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="card form-card">
        <div className="notice ok" role="status">
          <b>✅ Report received — thank you.</b> Your ticket has been created and routed to the responsible local
          body.
        </div>

        <p className="hint" style={{ marginTop: 18, marginBottom: 4, fontWeight: 800, color: 'var(--ink-soft)' }}>
          TICKET ID
        </p>
        <h1 className="ticket-id">{ticket.id}</h1>

        <div className="badge-row">
          <Badge tone={badgeTone('status', ticket.status)} glyph={status.glyph}>
            Status: {status.text}
          </Badge>
          <Badge tone={badgeTone('condition', ticket.issue === 'other' ? 'locked' : ticket.issue)} glyph={issue.glyph}>
            Issue: {issue.text}
          </Badge>
          <Badge tone={badgeTone('priority', ticket.priority)} glyph={priority.glyph}>
            {priority.text}
          </Badge>
        </div>

        <h2 style={{ fontSize: 20 }}>Ticket journey (simulated routing)</h2>
        <p className="map-note" style={{ marginTop: 0 }}>
          <span className="pill sim">SIMULATED</span> This prototype demonstrates the workflow — it does not connect
          to a live government system.
        </p>
        <Stepper steps={workflow} currentStatus={ticket.status} />

        <div className="detail-grid">
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>🏛️ Routed to</h3>
            <p style={{ margin: 0 }}>
              <b>{ticket.localBodyName}</b>
              <br />
              {ticket.jurisdiction}
            </p>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>⏱️ Response target</h3>
            <p style={{ margin: 0 }}>
              <b>{priority.text}</b> — first response expected within {ticket.slaHours} h
              <br />
              <span style={{ fontSize: 15 }}>By {dueDate(ticket.createdAt, ticket.slaHours)}</span>
            </p>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>🕒 Submitted</h3>
            <p style={{ margin: 0 }}>{formatDate(ticket.createdAt)}</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14, boxShadow: 'none' }}>
          <h3 style={{ marginTop: 0, fontSize: 17 }}>
            <span aria-hidden="true">📍</span> Facility
          </h3>
          <p style={{ margin: '0 0 8px' }}>
            <Link to={`/facility/${ticket.facilityId}`}>
              <b>{ticket.facilityName}</b>
            </Link>{' '}
            · <span className={`pill ${ticket.facilityType}`}>{ticket.facilityType === 'toilet' ? '🚻' : '💧'}{' '}
            {ticket.facilityType === 'toilet' ? 'Public toilet' : 'Drinking water'}</span>
          </p>
          {ticket.description && (
            <p className="desc" style={{ margin: 0, color: 'var(--ink-soft)' }}>
              “{ticket.description}”
            </p>
          )}
        </div>

        <div className="privacy-note">
          <b>🔒 Privacy</b>
          No personal information was collected or stored with this ticket — no name, phone, email, or location
          history. Only the facility, the issue, the optional description and the time were recorded.
        </div>

        <div className="form-actions">
          <Link className="btn" to="/admin">
            <span aria-hidden="true">📋</span> Watch it in the ticket desk (demo admin)
          </Link>
          <Link className="btn secondary" to="/">
            ← Back to the map
          </Link>
        </div>
      </div>
    </div>
  );
}
