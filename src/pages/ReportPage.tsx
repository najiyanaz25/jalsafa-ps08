import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Facility, Issue } from '../../shared/types';
import { api, NetworkError } from '../lib/api';
import { loadFacilityDetail, saveFacilityDetail } from '../lib/cache';
import { useOnline } from '../lib/hooks';
import { facilityTypeLabel } from '../lib/labels';

const ISSUES: { value: Issue; label: string }[] = [
  { value: 'clean', label: '🧼 Clean — it is in good order' },
  { value: 'usable', label: '👍 Usable — works for me' },
  { value: 'broken', label: '⚠️ Broken — damaged fixture' },
  { value: 'locked', label: '🔒 Locked — cannot be entered' },
  { value: 'no_water', label: '🚱 No water — taps dry' },
  { value: 'other', label: 'ℹ️ Other issue' },
];

/**
 * Accessible reporting workflow (spec E).
 * Deliberately asks for NO identity: no name, phone, email — and no location
 * field either (the facility itself carries the coordinates).
 */
export function ReportPage() {
  const { facilityId = '' } = useParams();
  const navigate = useNavigate();
  const online = useOnline();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .facility(facilityId)
      .then((f) => {
        if (!cancelled) {
          setFacility(f);
          saveFacilityDetail(f);
        }
      })
      .catch(() => {
        if (!cancelled) setFacility(loadFacilityDetail(facilityId));
      });
    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  const submit = async (): Promise<void> => {
    if (!issue) {
      setError('Please choose what you want to report.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.createTicket({ facilityId, issue, description });
      navigate(`/ticket/${result.ticket.id}`, { replace: true });
    } catch (err) {
      setError(
        err instanceof NetworkError
          ? 'Could not reach the server. Your report was NOT sent — reconnect and try again.'
          : err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      );
      setSubmitting(false);
    }
  };

  const type = facility ? facilityTypeLabel(facility.type) : null;

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="card form-card">
        <Link to={`/facility/${facilityId}`} className="btn ghost small">
          ← Back to facility
        </Link>

        <h1 style={{ marginTop: 16 }}>
          <span aria-hidden="true">📣</span> Report a problem
        </h1>
        <p style={{ marginTop: 0 }}>
          Facility: <b>{facility ? facility.name : 'Loading…'}</b>
          {type ? (
            <>
              {' '}
              · <span aria-hidden="true">{type.glyph}</span> {type.text}
            </>
          ) : null}
        </p>

        {!online && (
          <div className="notice warn" role="status">
            <b>You are offline.</b> Submitting needs an internet connection — everything else on this site still
            works from your saved cache. Reconnect to send this report.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <fieldset>
            <legend>What is the current state? (choose one)</legend>
            <div className="radio-grid">
              {ISSUES.map((option) => (
                <label className="radio-option" key={option.value}>
                  <input
                    type="radio"
                    name="issue"
                    value={option.value}
                    checked={issue === option.value}
                    onChange={() => {
                      setIssue(option.value);
                      setError(null);
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="desc">Short description (optional, max 200 characters)</label>
            <textarea
              id="desc"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Tap on the left sink is dry since morning."
              aria-describedby="desc-hint"
            />
            <p id="desc-hint" className="hint">
              {description.length}/200 characters. Please do not include personal details.
            </p>
          </div>

          <div className="privacy-note">
            <b>🔒 Your privacy</b>
            No name, phone number or email is asked for, sent, or stored. Your location is not attached to this
            report — only the facility ID, the issue you chose, the optional description and the submission time are
            recorded.
          </div>

          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={!online || submitting}>
              {submitting ? 'Submitting…' : 'Submit report & create ticket'}
            </button>
            <Link className="btn secondary" to={`/facility/${facilityId}`}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
