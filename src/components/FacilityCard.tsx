import { Link } from 'react-router-dom';
import type { Facility } from '../../shared/types';
import { distanceText } from '../lib/geo';
import {
  availabilityLabel,
  badgeTone,
  conditionLabel,
  facilityTypeLabel,
  formatDate,
  openStatusLabel,
} from '../lib/labels';
import { Badge } from './Badge';

const ACCESS_CHIPS: { key: keyof Facility['accessibility']; label: string; glyph: string }[] = [
  { key: 'wheelchairAccessible', label: 'Wheelchair', glyph: '♿' },
  { key: 'accessibleEntrance', label: 'Step-free entrance', glyph: '🚪' },
  { key: 'accessibleToilet', label: 'Accessible toilet', glyph: '🚻' },
  { key: 'handrails', label: 'Handrails', glyph: '🪜' },
  { key: 'babyChanging', label: 'Baby change', glyph: '👶' },
  { key: 'brailleSignage', label: 'Braille sign', glyph: '⠿' },
  { key: 'lighting', label: 'Lit at night', glyph: '💡' },
];

/** A facility card as required by spec A: name/type, distance, condition,
 *  availability, accessibility, last updated, local body, open/closed. */
export function FacilityCard({ facility, distanceKm }: { facility: Facility; distanceKm: number | null }) {
  const type = facilityTypeLabel(facility.type);
  const condition = conditionLabel(facility.condition);
  const availability = availabilityLabel(facility.availability);
  const open = openStatusLabel(facility.openStatus);
  const tags = ACCESS_CHIPS.filter((a) => facility.accessibility[a.key]);
  const stale = Date.now() - new Date(facility.lastUpdated).getTime() > 7 * 86_400_000;

  return (
    <article className="card facility-card" aria-label={facility.name}>
      <div className="card-top-row">
        <span className={`pill ${facility.type}`}>
          <span aria-hidden="true">{type.glyph}</span> {type.text}
        </span>
        <span className="distance">
          {distanceKm != null ? `⌖ ${distanceText(distanceKm)}` : '⌖ Distance needs location'}
        </span>
      </div>

      <h3>{facility.name}</h3>
      <p className="locality">
        {facility.locality} · {facility.address}
      </p>

      <div className="badge-row">
        <Badge tone={badgeTone('condition', facility.condition)} glyph={condition.glyph}>
          {condition.text}
        </Badge>
        <Badge tone={badgeTone('availability', facility.availability)} glyph={availability.glyph}>
          {availability.text}
        </Badge>
        <Badge tone={facility.openStatus === 'open' ? 'ok' : facility.openStatus === 'closed' ? 'bad' : 'muted'} glyph={open.glyph}>
          {open.text}
          {facility.hours ? ` · ${facility.hours}` : ''}
        </Badge>
      </div>

      <div className="access-tags">
        {tags.length > 0 ? (
          tags.map((a) => (
            <span className="access-tag" key={a.key}>
              <span aria-hidden="true">{a.glyph}</span> {a.label}
            </span>
          ))
        ) : (
          <span className="access-tag none">No accessibility features recorded</span>
        )}
      </div>

      <dl className="kv">
        <dt>Local body</dt>
        <dd>{facility.localBodyName}</dd>
      </dl>

      <p className={`freshness${stale ? ' stale' : ''}`}>
        <span aria-hidden="true">🕒</span>
        <b>Last updated: {formatDate(facility.lastUpdated)}</b>
        {stale ? <span>· older than a week — verify before travelling</span> : null}
      </p>

      <div className="card-actions">
        <Link className="btn small" to={`/facility/${facility.id}`}>
          View details
        </Link>
        <a
          className="btn small secondary"
          href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden="true">➤</span> Directions
        </a>
      </div>
    </article>
  );
}
