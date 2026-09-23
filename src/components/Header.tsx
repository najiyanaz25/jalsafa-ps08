import { Link, NavLink } from 'react-router-dom';
import { OfflineIndicator } from './OfflineIndicator';
import { useHighContrast } from '../lib/hooks';

export function Header() {
  const [contrast, toggleContrast] = useHighContrast();

  return (
    <header className="header">
      <div className="header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            💧
          </span>
          <span>
            <b>JalSafa</b>
            <small>Find public toilets &amp; drinking water near you</small>
          </span>
        </Link>

        <nav aria-label="Main">
          <NavLink to="/" end>
            <span aria-hidden="true">🗺️</span>&nbsp;Find facilities
          </NavLink>
          <NavLink to="/admin">
            <span aria-hidden="true">📋</span>&nbsp;Ticket desk
          </NavLink>
        </nav>

        <div className="header-actions">
          <OfflineIndicator />
          <button
            type="button"
            className="contrast-btn"
            aria-pressed={contrast}
            onClick={toggleContrast}
            title="Toggle high contrast"
          >
            ◐ High contrast
          </button>
        </div>
      </div>
    </header>
  );
}
