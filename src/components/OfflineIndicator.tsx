import { loadFacilityList } from '../lib/cache';
import { formatDate } from '../lib/labels';
import { useOnline } from '../lib/hooks';

/**
 * Always-visible connectivity state:
 *  • Online  → "live data"
 *  • Offline → "Offline mode" + when the cached copy was saved.
 */
export function OfflineIndicator() {
  const online = useOnline();
  const cached = loadFacilityList();

  if (online) {
    return (
      <span className="net-indicator" role="status">
        <span aria-hidden="true">●</span> Online — live data
      </span>
    );
  }

  return (
    <span className="net-indicator offline" role="status">
      <span aria-hidden="true">◐</span> Offline mode
      {cached ? <small>· cached {formatDate(cached.savedAt)}</small> : <small>· no cache yet</small>}
    </span>
  );
}
