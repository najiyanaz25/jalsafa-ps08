import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { AdminPage } from './pages/AdminPage';
import { FacilityPage } from './pages/FacilityPage';
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { TicketPage } from './pages/TicketPage';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/facility/:id" element={<FacilityPage />} />
          <Route path="/report/:facilityId" element={<ReportPage />} />
          <Route path="/ticket/:id" element={<TicketPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site">
        <div className="container">
          <p>
            <b>JalSafa</b> — find public toilets &amp; drinking water near you. Demo city: <b>Kochi, Kerala</b>.
            Facility dataset, local-body mapping and workflow rules are sample data pending the organiser's official
            files.
          </p>
          <p>
            <b>Privacy:</b> we never ask for your name, phone or email. Your device location is used only in your
            browser to sort nearby facilities — it is never stored, never sent to the server, and no movement history
            is kept.
          </p>
          <p>
            <b>Simulated workflow:</b> ticket routing to local bodies is a demonstration of the flow; no live
            government API is connected. Always verify a facility before travelling.
          </p>
        </div>
      </footer>
    </>
  );
}
