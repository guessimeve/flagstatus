import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: '*' });

fastify.get('/health', async () => {
  return { ok: true };
});

fastify.get('/api/status', async (request) => {
  const state = request.query.state ?? null;

  // TODO: replace with real DB/scraper lookup
  return {
    national: {
      status: 'half',
      reason: 'Presidential proclamation — Memorial Day',
      since: '2026-05-25',
      source: 'whitehouse.gov',
    },
    state: {
      status: 'full',
      reason: null,
      since: null,
      source: null,
    },
    effective: 'half',
    effectiveReason: 'Presidential proclamation — Memorial Day',
  };
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

try {
  await fastify.listen({ port, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
