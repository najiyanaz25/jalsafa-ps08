MediFind — 4 Dashboard Hackathon Prototype (Final Upgrade)

Open index.html through VS Code Live Server or deploy to HTTPS/GitHub Pages for browser geolocation.

Dashboards:
1. Find Medicine — medicine search, stock summary, medicine details, distance, map, filters, call/directions, live location.
2. Health Facilities Directory — facility cards, distance, map, filters, call/directions.
3. Generic & Bioequivalent Medicines — generic information and Patient Safety & Medical Disclaimer.
4. Data Freshness & Stock Simulator — stock simulator, verifier/license validation, automatic audit trail, reporting audit.

Final requested additions:
- Verifier/license validation uses the authorized hackathon demo verifier:
  Staff Pharmacist (K. Tan, Reg #PH-4821)
- Incorrect verifier/license input shows a warning and blocks publishing.
- Correct verification automatically records an audit trail entry under the simulator.
- Audit entries are stored locally in the browser for the demo.
- Medicine search displays medicine details directly under the searched medicine/results summary.
- Existing design, four-dashboard structure, language switching, live location, distance, maps, call/directions, filters and accessibility features are retained.

Important:
All facility coordinates, stock levels, timestamps, verifier credentials and inventory records are simulated hackathon demonstration data. This prototype does not connect to a live government inventory system and should not be used for medical decisions.


Language update: facility/hospital names, addresses, opening hours, types and map popups now switch between English, Malayalam and Hindi when the language selector changes.
