import type { Accessibility, Availability, Condition, FacilityType } from '../../shared/types';

export interface Filters {
  query: string;
  type: 'all' | FacilityType;
  maxDistanceKm: number | null;
  availability: Availability[];
  conditions: Condition[];
  accessibleOnly: boolean;
  access: {
    wheelchairAccessible: boolean;
    accessibleEntrance: boolean;
    accessibleToilet: boolean;
    handrails: boolean;
    babyChanging: boolean;
    brailleSignage: boolean;
    lighting: boolean;
  };
}

export const emptyFilters: Filters = {
  query: '',
  type: 'all',
  maxDistanceKm: null,
  availability: [],
  conditions: [],
  accessibleOnly: false,
  access: {
    wheelchairAccessible: false,
    accessibleEntrance: false,
    accessibleToilet: false,
    handrails: false,
    babyChanging: false,
    brailleSignage: false,
    lighting: false,
  },
};

const ACCESS_FIELDS: { key: keyof Accessibility; label: string; glyph: string }[] = [
  { key: 'wheelchairAccessible', label: 'Wheelchair accessible (step-free)', glyph: '♿' },
  { key: 'accessibleEntrance', label: 'Accessible entrance', glyph: '🚪' },
  { key: 'accessibleToilet', label: 'Accessible toilet', glyph: '🚻' },
  { key: 'handrails', label: 'Handrails', glyph: '🪜' },
  { key: 'babyChanging', label: 'Baby changing table', glyph: '👶' },
  { key: 'brailleSignage', label: 'Braille signage', glyph: '⠿' },
  { key: 'lighting', label: 'Lit at night', glyph: '💡' },
];

export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.query.trim()) n += 1;
  if (f.type !== 'all') n += 1;
  if (f.maxDistanceKm != null) n += 1;
  n += f.availability.length;
  n += f.conditions.length;
  if (f.accessibleOnly) n += 1;
  n += Object.values(f.access).filter(Boolean).length;
  return n;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
  hasLocation: boolean;
}

/** All filters are combinable (AND across groups, OR inside a group). */
export function FilterPanel({ value, onChange, hasLocation }: Props) {
  const set = (patch: Partial<Filters>): void => onChange({ ...value, ...patch });
  const count = activeFilterCount(value);

  const distanceOptions: { label: string; km: number | null }[] = [
    { label: 'Any distance', km: null },
    { label: 'Within 1 km', km: 1 },
    { label: 'Within 2 km', km: 2 },
    { label: 'Within 5 km', km: 5 },
  ];

  return (
    <section className="card" aria-label="Filters">
      <div className="toolbar">
        <button
          type="button"
          className="chip accessible-chip"
          aria-pressed={value.accessibleOnly}
          onClick={() => set({ accessibleOnly: !value.accessibleOnly })}
          title="Step-free, accessible entrance and accessible toilet"
        >
          ♿ Accessible facility only
        </button>

        {(['all', 'toilet', 'water'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className="chip"
            aria-pressed={value.type === t}
            onClick={() => set({ type: t })}
          >
            {t === 'all' ? '🏢 All types' : t === 'toilet' ? '🚻 Toilets' : '💧 Drinking water'}
          </button>
        ))}

        <span className="chip" style={{ cursor: 'default' }}>
          <label htmlFor="distance" style={{ fontWeight: 700 }}>
            ⌖ Distance
          </label>
          <select
            id="distance"
            value={value.maxDistanceKm == null ? 'any' : String(value.maxDistanceKm)}
            onChange={(e) => set({ maxDistanceKm: e.target.value === 'any' ? null : Number(e.target.value) })}
            style={{ width: 'auto', minHeight: 34, padding: '2px 8px', border: 'none' }}
            disabled={!hasLocation}
            aria-describedby={hasLocation ? undefined : 'distance-help'}
          >
            {distanceOptions.map((o) => (
              <option key={o.label} value={o.km == null ? 'any' : String(o.km)}>
                {o.label}
              </option>
            ))}
          </select>
        </span>

        {count > 0 && (
          <button type="button" className="chip" onClick={() => onChange({ ...emptyFilters, query: value.query })}>
            ✕ Clear filters ({count})
          </button>
        )}
      </div>

      {!hasLocation && (
        <p id="distance-help" className="map-note">
          <span aria-hidden="true">📍</span> Turn on location to filter and sort by distance. Location is used only
          on this device and is never stored or sent to the server.
        </p>
      )}

      <div className="filters-grid">
        <fieldset>
          <legend>Availability</legend>
          <div className="check-list">
            {(['available', 'unavailable'] as const).map((a) => (
              <label key={a}>
                <input
                  type="checkbox"
                  checked={value.availability.includes(a)}
                  onChange={() => set({ availability: toggle(value.availability, a) })}
                />
                {a === 'available' ? '✔ Available' : '✘ Unavailable'}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Condition</legend>
          <div className="check-list">
            {([
              ['clean', '🧼 Clean'],
              ['usable', '👍 Usable'],
              ['broken', '⚠️ Broken'],
              ['locked', '🔒 Locked'],
              ['no_water', '🚱 No water'],
            ] as const).map(([c, label]) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={value.conditions.includes(c)}
                  onChange={() => set({ conditions: toggle(value.conditions, c) })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Accessibility</legend>
          <div className="check-list">
            {ACCESS_FIELDS.map((a) => (
              <label key={a.key}>
                <input
                  type="checkbox"
                  checked={value.access[a.key]}
                  onChange={() => set({ access: { ...value.access, [a.key]: !value.access[a.key] } })}
                />
                <span aria-hidden="true">{a.glyph}</span> {a.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
