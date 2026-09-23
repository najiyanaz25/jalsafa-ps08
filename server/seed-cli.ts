/**
 * Drop and re-seed the demo database:
 *   npm run seed
 * Useful before a judging demo so ticket counts and facility states are fresh.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');

for (const suffix of ['', '-wal', '-shm', '-journal']) {
  const file = path.join(dataDir, `jalsafa.db${suffix}`);
  if (fs.existsSync(file)) fs.rmSync(file);
}

const { dbReady, client } = await import('./db');
await dbReady;

const facilities = await client.execute('SELECT COUNT(*) AS n FROM facilities');
const tickets = await client.execute('SELECT COUNT(*) AS n FROM tickets');
const bodies = await client.execute('SELECT COUNT(*) AS n FROM local_bodies');
console.log(
  `Seeded: ${facilities.rows[0].n} facilities, ${bodies.rows[0].n} local bodies, ${tickets.rows[0].n} sample tickets.`,
);
client.close();
