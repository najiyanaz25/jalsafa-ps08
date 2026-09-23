import { formatDate } from '../lib/labels';

/** Mandatory data-freshness explanation (spec I). */
export function FreshnessNote({ iso }: { iso: string }) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  const old = days > 7;
  return (
    <div className={`freshness-panel${old ? ' stale' : ''}`}>
      <span aria-hidden="true">🕒</span>
      <span className="big">Last updated: {formatDate(iso)}</span>
      <p>
        Facility conditions can change at any time — a lock can be added, a tap can run dry, or cleaning can happen
        between visits. The information above is based on the latest available update
        {old ? ` (about ${days} days old — please verify before travelling)` : ''}.
      </p>
    </div>
  );
}
