/**
 * JalSafa server — one small Express app that
 *   • exposes the JSON API (/api/...), and
 *   • serves the built React UI from dist/ in production.
 *
 * Run dev:  npm run dev:api  (tsx watch, port 8787, proxied by Vite)
 * Run prod: npm run build && npm start  (same process serves UI + API)
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Issue, TicketStatus } from '../shared/types';
import { client, dbReady } from './db';
import * as store from './store';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '..', 'dist');
const PORT = Number(process.env.PORT ?? 8787);

const VALID_ISSUES: Issue[] = ['clean', 'usable', 'broken', 'locked', 'no_water', 'other'];
const VALID_STATUSES: TicketStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved'];

const app = express();
app.use(express.json({ limit: '10kb' }));

// ── API ─────────────────────────────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    facilityCount: await store.countFacilities(),
    simulated: true,
  });
});

app.get('/api/local-bodies', async (_req, res) => {
  res.json(await store.listLocalBodies());
});

app.get('/api/workflow-rules', async (_req, res) => {
  res.json(await store.listWorkflowRules());
});

app.get('/api/facilities', async (_req, res, next) => {
  try {
    res.json(await store.listFacilities());
  } catch (err) {
    next(err);
  }
});

app.get('/api/facilities/:id', async (req, res, next) => {
  try {
    const facility = await store.getFacility(req.params.id);
    if (!facility) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }
    res.json(facility);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets
 * Accepts ONLY { facilityId, issue, description }.
 * There is deliberately no field for name / phone / email / coordinates.
 */
app.post('/api/tickets', async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as { facilityId?: unknown; issue?: unknown; description?: unknown };

    if (typeof body.facilityId !== 'string' || !body.facilityId.trim()) {
      res.status(400).json({ error: 'facilityId is required' });
      return;
    }
    if (typeof body.issue !== 'string' || !VALID_ISSUES.includes(body.issue as Issue)) {
      res.status(400).json({ error: `issue must be one of: ${VALID_ISSUES.join(', ')}` });
      return;
    }
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length > 200) {
      res.status(400).json({ error: 'description must be 200 characters or fewer' });
      return;
    }

    const result = await store.createTicket({
      facilityId: body.facilityId.trim(),
      issue: body.issue as Issue,
      description,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/tickets', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? (req.query.status as TicketStatus) : undefined;
    const localBodyId = typeof req.query.localBodyId === 'string' ? req.query.localBodyId : undefined;
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    res.json(await store.listTickets({ status, localBodyId }));
  } catch (err) {
    next(err);
  }
});

app.get('/api/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await store.getTicket(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json({ ticket, workflow: store.buildWorkflow(ticket) });
  } catch (err) {
    next(err);
  }
});

/** Simulated workflow step: submitted → assigned → in_progress → resolved. */
app.patch('/api/tickets/:id/advance', async (req, res, next) => {
  try {
    res.json(await store.advanceTicket(req.params.id));
  } catch (err) {
    next(err);
  }
});

// ── Static UI (production) ──────────────────────────────────────────────────

const isApiPath = (p: string): boolean => p === '/api' || p.startsWith('/api/');

app.use((req, res, next) => {
  if (req.method !== 'GET' || isApiPath(req.path)) {
    next();
    return;
  }
  if (!fs.existsSync(distDir)) {
    res
      .status(404)
      .send('JalSafa UI is not built yet. Run "npm run build", or use "npm run dev" (Vite on :5173).');
    return;
  }
  express.static(distDir)(req, res, next);
});

// SPA fallback so /facility/f07, /admin etc. work on reload.
app.get('*', (req, res, next) => {
  if (req.method !== 'GET' || isApiPath(req.path)) {
    next();
    return;
  }
  const indexFile = path.join(distDir, 'index.html');
  if (fs.existsSync(indexFile)) res.sendFile(indexFile);
  else res.status(404).send('UI not built. Run "npm run build".');
});

// ── Error handling ──────────────────────────────────────────────────────────

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  if (status >= 500) console.error('[jalsafa] error:', err);
  res.status(status).json({ error: message });
});

// ── Start ───────────────────────────────────────────────────────────────────

await dbReady;
app.listen(PORT, () => {
  console.log(`JalSafa API listening on http://localhost:${PORT}`);
  console.log(`  UI: ${fs.existsSync(distDir) ? `served from ${distDir}` : 'not built (use npm run dev)'}`);
  console.log('  Routing workflow: SIMULATED (demo) — no live government API connected.');
});

process.on('SIGINT', () => {
  client.close();
  process.exit(0);
});
