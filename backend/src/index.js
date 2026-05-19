import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import cron from 'node-cron';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { runScraper } from './scraper.js';
import { getStatutoryStatus } from './statutory.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: '*' });

fastify.get('/health', async () => ({ ok: true }));

fastify.get('/api/status', async (request) => {
  const state = (request.query.state ?? '').toUpperCase() || null;

  // 1. Check statutory dates first (highest priority)
  const statutory = getStatutoryStatus(new Date());

  // 2. Most recent national proclamation from DB
  const nationalRow = db.prepare(`
    SELECT * FROM proclamations
    WHERE scope = 'national'
      AND (expires IS NULL OR expires >= date('now'))
    ORDER BY since DESC
    LIMIT 1
  `).get();

  // 3. Most recent state-level proclamation (if state provided)
  const stateRow = state
    ? db.prepare(`
        SELECT * FROM proclamations
        WHERE scope = 'state' AND state = ?
          AND (expires IS NULL OR expires >= date('now'))
        ORDER BY since DESC
        LIMIT 1
      `).get(state)
    : null;

  // Build national status: statutory > proclamation > full
  const national = statutory ?? (nationalRow
    ? { status: nationalRow.status, reason: nationalRow.reason, source: nationalRow.source, url: nationalRow.url, since: nationalRow.since }
    : { status: 'full', reason: null, source: null, url: null, since: null });

  const stateStatus = stateRow
    ? { status: stateRow.status, reason: stateRow.reason, source: stateRow.source, url: stateRow.url, since: stateRow.since }
    : { status: 'full', reason: null, source: null, url: null, since: null };

  // Effective = half if either national or state says half
  const effectiveIsHalf = national.status === 'half' || stateStatus.status === 'half';
  const effective = effectiveIsHalf ? 'half' : 'full';
  const effectiveReason = effectiveIsHalf
    ? (national.status === 'half' ? national.reason : stateStatus.reason)
    : null;

  return { national, state: stateStatus, effective, effectiveReason };
});

// Poll every 30 minutes
cron.schedule('*/30 * * * *', () => {
  runScraper().catch(err => fastify.log.error({ err }, 'scraper error'));
});

// Serve the Expo web export if it exists (production)
const publicDir = join(__dirname, '..', 'public');
if (existsSync(publicDir)) {
  await fastify.register(fastifyStatic, { root: publicDir });
  fastify.setNotFoundHandler((_req, reply) => reply.sendFile('index.html'));
}

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

try {
  await fastify.listen({ port, host: '0.0.0.0' });
  // Run scraper once on startup
  runScraper().catch(err => fastify.log.error({ err }, 'initial scraper error'));
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
