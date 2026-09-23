import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Accessibility, Facility } from '../../shared/types';
import { api, NetworkError } from '../lib/api';
import { loadFacilityDetail, saveFacilityDetail } from '../lib/cache';
import { distanceText, haversineKm } from '../lib/geo';
import { useGeolocation, useOnline } from '../lib/hooks';
import {
  availabilityLabel,
  badgeTone,
  conditionLabel,
  facilityTypeLabel,
  formatDate,
  openStatusLabel,
} from '../lib/labels';
import { Badge } from '../components/Badge';
import { FreshnessNote } from '../components/FreshnessNote';

const ACCESS_ROWS: { key: keyof Accessibility; label: string; glyph: string }[] = [
  { key: 'wheelchairAccessible', label: 'Wheelchair accessible (step-free approach)', glyph: '♿' },
  { key: 'accessibleEntrance', label: 'Accessible entrance', glyph: '🚪' },
  { key: 'accessibleToilet', label: 'Accessible toilet / grab rails', glyph: '🚻' },
  { key: 'handrails', label: 'Handrails provided', glyph: '🪜' },
  { key: 'babyChanging', label: 'Baby changing facility', glyph: '👶' },
  { key: 'brailleSignage', label: 'Braille signage', glyph: '⠿' },
  { key: 'lighting', label: 'Lit at night', glyph: '💡' },
];

type LoadState = 'loading' | 'live' | 'cache' | 'missing';

export function FacilityPage() {
  const { id = '' } = useParams();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const { coords } = useGeolocation();
  const online = useOnline();

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api
      .facility(id)
      .then((f) => {
        if (cancelled) return;
        setFacility(f);
        saveFacilityDetail(f);
        setState('live');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const cached = loadFacilityDetail(id);
        if (cached) {
          setFacility(cached);
          setState('cache');
        } else {
          setFacility(null);
          setState(err instanceof NetworkError ? 'cache' : 'missing');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === 'loading') {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="card empty-state">Loading facility…</div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="card empty-state">
          <p>
            {state === 'cache'
              ? 'This facility is not in your offline cache and the server is unreachable.'
              : 'Facility not found.'}
          </p>
          <Link className="btn" to="/">
            ← Back to the map
          </Link>
        </div>
      </div>
    );
  }

  const type = facilityTypeLabel(facility.type);
  const condition = conditionLabel(facility.condition);
  const availability = availabilityLabel(facility.availability);
  const open = openStatusLabel(facility.openStatus);
  const distanceKm = coords ? haversineKm(coords, facility) : null;

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <Link to="/" className="btn ghost small">
        ← Back to results
      </Link>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="detail-head">
          <div style={{ flex: 1, minWidth: 260 }}>
            <span className={`pill ${facility.type}`}>
              <span aria-hidden="true">{type.glyph}</span> {type.text}
            </span>
            <h1>{facility.name}</h1>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              {facility.address}, {facility.locality}
            </p>
          </div>
        </div>

        <div className="badge-row" style={{ marginTop: 14 }}>
          <Badge tone={badgeTone('condition', facility.condition)} glyph={condition.glyph}>
            Condition: {condition.text}
          </Badge>
          <Badge tone={badgeTone('availability', facility.availability)} glyph={availability.glyph}>
            {availability.text}
          </Badge>
          <Badge tone={facility.openStatus === 'open' ? 'ok' : facility.openStatus === 'closed' ? 'bad' : 'muted'} glyph={open.glyph}>
            {open.text}
            {facility.hours ? ` · ${facility.hours}` : ''}
          </Badge>
          <Badge tone="info" glyph="🏛️">
            {facility.localBodyName}
          </Badge>
        </div>

        {state === 'cache' && (
          <div className="notice warn" role="status">
            <b>Offline — saved copy.</b> This is the information stored on your device from an earlier visit. Live
            confirmation needs a connection.
          </div>
        )}

        <div className="detail-grid">
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>⌖ Distance</h3>
            <p style={{ margin: 0 }}>
              {distanceKm != null ? (
                <b>{distanceText(distanceKm)} away</b>
              ) : (
                <>Enable location on the home screen to see distance.</>
              )}
            </p>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>🏛️ Responsible local body</h3>
            <p style={{ margin: 0 }}>
              <b>{facility.localBodyName}</b>
              <br />
              Reports for this facility are routed here.
            </p>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>🕒 Opening status</h3>
            <p style={{ margin: 0 }}>
              <b>{open.text}</b>
              <br />
              {facility.hours ?? 'Opening hours not recorded.'}
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: 20, marginTop: 22 }}>Accessibility information</h2>
        <table className="access-table">
          <caption className="sr-only">Accessibility features at {facility.name}</caption>
          <tbody>
            {ACCESS_ROWS.map((row) => {
              const isToiletRow = row.key === 'accessibleToilet';
              const notApplicable = facility.type === 'water' && isToiletRow;
              const yes = facility.accessibility[row.key];
              return (
                <tr key={row.key}>
                  <th scope="row">
                    <span aria-hidden="true">{row.glyph}</span> {row.label}
                  </th>
                  <td>
                    {notApplicable ? (
                      <span className="badge muted">
                        <span className="glyph" aria-hidden="true">
                          ➖
                        </span>
                        Not applicable (water point)
                      </span>
                    ) : yes ? (
                      <span className="badge ok">
                        <span className="glyph" aria-hidden="true">
                          ✔
                        </span>
                        Yes
                      </span>
                    ) : (
                      <span className="badge muted">
                        <span className="glyph" aria-hidden="true">
                          ✘
                        </span>
                        Not recorded
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <FreshnessNote iso={facility.lastUpdated} />

        <div className="card-actions" style={{ marginTop: 16 }}>
          {online ? (
            <Link className="btn" to={`/report/${facility.id}`}>
              <span aria-hidden="true">📣</span> Report a problem
            </Link>
          ) : (
            <>
              <button type="button" className="btn" disabled>
                <span aria-hidden="true">📣</span> Report a problem
              </button>
              <span className="notice warn" style={{ marginTop: 0 }}>
                Reporting needs an internet connection. You can still read all cached information above.
              </span>
            </>
          )}
          <a
            className="btn secondary"
            href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!online}
            onClick={(e) => {
              if (!online) e.preventDefault();
            }}
          >
            <span aria-hidden="true">➤</span> Get directions
          </a>
          {!online && <span className="map-note">Directions open Google Maps and need a connection.</span>}
        </div>

        <div className="privacy-note">
          <b>Privacy</b>
          This page shows facility information only. No reporter name, phone number, email or movement history is ever
          displayed — or stored.
        </div>

        <p className="map-note" style={{ marginTop: 14 }}>
          Record ID: {facility.id} · Coordinates {facility.lat.toFixed(5)}, {facility.lng.toFixed(5)} (facility
          location, not yours) · Loaded {formatDate(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
}
