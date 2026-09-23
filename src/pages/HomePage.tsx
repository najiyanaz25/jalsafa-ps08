import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Accessibility, Facility } from '../../shared/types';
import { api } from '../lib/api';
import { loadFacilityDetail, loadFacilityList, loadRecentIds, saveFacilityList } from '../lib/cache';
import { haversineKm } from '../lib/geo';
import { useGeolocation, useOnline } from '../lib/hooks';
import { conditionLabel } from '../lib/labels';
import { FacilityCard } from '../components/FacilityCard';
import { FacilityMap } from '../components/FacilityMap';
import { FilterPanel, activeFilterCount, emptyFilters, type Filters } from '../components/FilterPanel';

type Source = 'live' | 'cache' | 'empty';

export function HomePage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [source, setSource] = useState<Source>('empty');
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recent] = useState<string[]>(() => loadRecentIds());

  const { coords, request, requesting, denied } = useGeolocation();
  const online = useOnline();

  // Load facilities: live API → cache on success, localStorage cache on failure.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .facilities()
      .then((list) => {
        if (cancelled) return;
        setFacilities(list);
        saveFacilityList(list);
        setSource('live');
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const cached = loadFacilityList();
        if (cached) {
          setFacilities(cached.facilities);
          setCachedAt(cached.savedAt);
          setSource('cache');
        } else {
          setFacilities([]);
          setSource('empty');
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [online]);

  const results = useMemo(() => {
    type Item = { facility: Facility; distanceKm: number | null };
    let list: Item[] = facilities.map((facility) => ({
      facility,
      distanceKm: coords ? haversineKm(coords, facility) : null,
    }));

    const q = filters.query.trim().toLowerCase();
    if (q) {
      list = list.filter(({ facility: f }) =>
        [f.name, f.address, f.locality].some((v) => v.toLowerCase().includes(q)),
      );
    }
    if (filters.type !== 'all') list = list.filter(({ facility: f }) => f.type === filters.type);
    if (filters.availability.length) {
      list = list.filter(({ facility: f }) => filters.availability.includes(f.availability));
    }
    if (filters.conditions.length) {
      list = list.filter(({ facility: f }) => filters.conditions.includes(f.condition));
    }
    if (filters.accessibleOnly) {
      list = list.filter(
        ({ facility: f }) =>
          f.accessibility.wheelchairAccessible && f.accessibility.accessibleEntrance && f.accessibility.accessibleToilet,
      );
    }
    const activeAccess = (Object.keys(filters.access) as (keyof Accessibility)[]).filter(
      (k) => filters.access[k],
    );
    if (activeAccess.length) {
      list = list.filter(({ facility: f }) => activeAccess.every((k) => f.accessibility[k]));
    }
    if (filters.maxDistanceKm != null && coords) {
      list = list.filter((item) => item.distanceKm != null && item.distanceKm <= (filters.maxDistanceKm ?? Infinity));
    }

    if (coords) list.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    else list.sort((a, b) => a.facility.name.localeCompare(b.facility.name));

    return list;
  }, [facilities, filters, coords]);

  const selected = selectedId ? results.find((r) => r.facility.id === selectedId) : undefined;
  const filterCount = activeFilterCount(filters);
  const recentFacilities = recent
    .map((id) => facilities.find((f) => f.id === id) ?? loadFacilityDetail(id))
    .filter((f): f is Facility => Boolean(f));

  return (
    <>
      <section className="hero-strip">
        <div className="container">
          <h1>Find a usable toilet or drinking water before you travel.</h1>
          <p>
            Demo city: <b>Kochi, Kerala</b> — condition, accessibility, responsible local body and last-updated time
            for every point.
          </p>
        </div>
      </section>

      <div className="container search-filters">
        <section className="card" aria-label="Search">
          <div className="search-row">
            <label className="sr-only" htmlFor="q">
              Search by name, area or street
            </label>
            <input
              id="q"
              type="search"
              placeholder="Search by name, area or street — e.g. Marine Drive, Infopark…"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            />
            <button type="button" onClick={() => document.getElementById('results-heading')?.focus()}>
              <span aria-hidden="true">🔍</span> Search
            </button>
          </div>

          <div className="toolbar" style={{ marginTop: 12 }}>
            {coords ? (
              <span className="chip chip-active" style={{ cursor: 'default' }}>
                <span aria-hidden="true">📍</span> Nearby sorted by distance
              </span>
            ) : (
              <button type="button" className="chip" onClick={request} disabled={requesting}>
                <span aria-hidden="true">📍</span> {requesting ? 'Locating…' : 'Use my location'}
              </button>
            )}
            {denied && (
              <span className="badge warn" role="status">
                <span className="glyph" aria-hidden="true">
                  ⚠️
                </span>
                Location permission denied — distances unavailable
              </span>
            )}
          </div>
        </section>

        <div style={{ marginTop: 14 }}>
          <FilterPanel value={filters} onChange={setFilters} hasLocation={Boolean(coords)} />
        </div>

        {!online && (
          <div className="notice warn" role="status">
            <b>Offline mode.</b> You are browsing the copy saved on this device
            {cachedAt ? ` from ${new Date(cachedAt).toLocaleString()}` : ''}. Facility cards, details and map markers
            still work. <b>Reporting a problem needs a connection</b> — the form will say so before you type.
          </div>
        )}
        {source === 'cache' && online && (
          <div className="notice warn" role="status">
            Live data could not be loaded — showing your saved copy from{' '}
            {cachedAt ? new Date(cachedAt).toLocaleString() : 'an earlier visit'}.
          </div>
        )}
        {source === 'empty' && !loading && (
          <div className="notice error" role="alert">
            Facility data could not be loaded and no cached copy exists on this device. Reconnect and reload.
          </div>
        )}

        <p className="results-note" aria-live="polite">
          <b>
            {loading ? 'Loading facilities…' : `Showing ${results.length} of ${facilities.length} facilities`}
          </b>{' '}
          · {filterCount > 0 ? `${filterCount} filter${filterCount > 1 ? 's' : ''} active · ` : ''}
          {coords ? 'sorted nearest first' : 'A–Z (enable location to sort by distance)'}
        </p>

        <div className="split">
          <FacilityMap
            facilities={results.map((r) => r.facility)}
            userLocation={coords}
            selectedId={selectedId}
            onSelect={setSelectedId}
          >
            {selected && (
              <div className="selected-strip">
                <span className="name">
                  {conditionLabel(selected.facility.condition).glyph} {selected.facility.name}
                </span>
                <Link className="btn small" to={`/facility/${selected.facility.id}`}>
                  Open details
                </Link>
                <button type="button" className="btn small ghost" onClick={() => setSelectedId(null)}>
                  ✕ Close
                </button>
              </div>
            )}
          </FacilityMap>

          <div>
            <h2 id="results-heading" tabIndex={-1} style={{ fontSize: 20, margin: '2px 0 10px' }}>
              Nearby facilities
            </h2>
            <div className="results">
              {loading && <div className="card empty-state">Loading facility data…</div>}
              {!loading && results.length === 0 && (
                <div className="card empty-state">
                  <p>No facilities match your filters.</p>
                  <button type="button" className="btn secondary" onClick={() => setFilters(emptyFilters)}>
                    Clear all filters
                  </button>
                </div>
              )}
              {results.map(({ facility, distanceKm }) => (
                <FacilityCard key={facility.id} facility={facility} distanceKm={distanceKm} />
              ))}
            </div>

            {recentFacilities.length > 0 && (
              <div className="recent-row" aria-label="Recently viewed facilities (cached on this device)">
                <span className="label">🕘 Recently viewed (cached):</span>
                {recentFacilities.map((f) => (
                  <Link key={f.id} className="chip" to={`/facility/${f.id}`}>
                    {f.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
