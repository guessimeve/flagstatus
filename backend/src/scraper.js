import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import db from './db.js';
import { STATE_FEEDS } from './states.js';

const WH_FEED = 'https://www.whitehouse.gov/presidential-actions/feed/';
const FR_FEED = 'https://www.federalregister.gov/presidential-documents/proclamations.rss';

const parser = new XMLParser({ ignoreAttributes: false });

// Keywords that indicate a flag proclamation
const HALF_STAFF_RE = /half[- ]staff|lower.*flag|flag.*lower|fly.*half|half.*mast/i;
const FULL_STAFF_RE = /full[- ]staff|raise.*flag|flag.*rais|return.*full/i;

// Extract plain text from HTML
function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseFlagStatus(title, body) {
  const text = `${title} ${body}`;
  if (HALF_STAFF_RE.test(text)) return 'half';
  if (FULL_STAFF_RE.test(text)) return 'full';
  return null;
}

// Pull a clean reason string from the proclamation title
function extractReason(title = '') {
  return title
    .replace(/^proclamation\s+on\s+/i, '')
    .replace(/^proclamation\s+/i, '')
    .trim();
}

async function fetchFeed(url) {
  const res = await axios.get(url, {
    timeout: 10_000,
    headers: { 'User-Agent': 'FlagStatus/1.0 (flag status tracker)' },
  });
  const parsed = parser.parse(res.data);
  return parsed?.rss?.channel?.item ?? [];
}

async function scrapeWhiteHouse() {
  const items = await fetchFeed(WH_FEED);
  let saved = 0;

  for (const item of items) {
    const title = item.title ?? '';
    if (!/proclaim|flag|half.?staff/i.test(title)) continue;

    const body = stripHtml(item['content:encoded'] ?? item.description ?? '');
    const status = parseFlagStatus(title, body);
    if (!status) continue;

    const id = item.guid?.['#text'] ?? item.guid ?? item.link;
    const since = item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : null;
    const reason = extractReason(title);

    const existing = db.prepare('SELECT id FROM proclamations WHERE id = ?').get(id);
    if (existing) continue;

    db.prepare(`
      INSERT INTO proclamations (id, scope, state, status, reason, since, expires, source, fetched_at)
      VALUES (?, 'national', NULL, ?, ?, ?, NULL, 'whitehouse.gov', ?)
    `).run(id, status, reason, since, new Date().toISOString());

    saved++;
  }

  return saved;
}

async function scrapeFederalRegister() {
  const items = await fetchFeed(FR_FEED);
  let saved = 0;

  for (const item of items) {
    const title = item.title ?? '';
    const body = stripHtml(item.description ?? '');
    const status = parseFlagStatus(title, body);
    if (!status) continue;

    const id = `fr:${item.guid ?? item.link}`;
    const since = item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : null;
    const reason = extractReason(title);

    const existing = db.prepare('SELECT id FROM proclamations WHERE id = ?').get(id);
    if (existing) continue;

    db.prepare(`
      INSERT INTO proclamations (id, scope, state, status, reason, since, expires, source, fetched_at)
      VALUES (?, 'national', NULL, ?, ?, ?, NULL, 'federalregister.gov', ?)
    `).run(id, status, reason, since, new Date().toISOString());

    saved++;
  }

  return saved;
}

async function scrapeState({ state, feed, name }) {
  const items = await fetchFeed(feed);
  let saved = 0;

  for (const item of items) {
    const title = item.title ?? '';
    const body  = stripHtml(item['content:encoded'] ?? item.description ?? '');
    const status = parseFlagStatus(title, body);
    if (!status) continue;

    const id    = `state:${state}:${item.guid?.['#text'] ?? item.guid ?? item.link}`;
    const since = item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : null;
    const reason = extractReason(title);

    const existing = db.prepare('SELECT id FROM proclamations WHERE id = ?').get(id);
    if (existing) continue;

    db.prepare(`
      INSERT INTO proclamations (id, scope, state, status, reason, since, expires, source, fetched_at)
      VALUES (?, 'state', ?, ?, ?, ?, NULL, ?, ?)
    `).run(id, state, status, reason, since, `governor.${name.toLowerCase().replace(/ /g,'-')}.gov`, new Date().toISOString());

    saved++;
  }

  return saved;
}

async function scrapeCtPage() {
  const res = await axios.get(
    'https://portal.ct.gov/governor/flag-status?language=en_US',
    { timeout: 10_000, headers: { 'User-Agent': 'FlagStatus/1.0 (flag status tracker)' } }
  );

  // Extract text from all richtext-content blocks
  const blocks = [...res.data.matchAll(/<article[^>]*richtext-content[^>]*>([\s\S]*?)<\/article>/gi)];
  const text = blocks.map(m => stripHtml(m[1])).join(' ').trim();

  const status = text ? parseFlagStatus('', text) : 'full';
  const reason = status === 'half' ? extractReason(text.slice(0, 120)) : null;
  const since  = new Date().toISOString().split('T')[0];

  // Upsert a single record that always reflects current CT page state
  db.prepare(`
    INSERT INTO proclamations (id, scope, state, status, reason, since, expires, source, fetched_at)
    VALUES ('ct:current', 'state', 'CT', ?, ?, ?, NULL, 'portal.ct.gov', ?)
    ON CONFLICT(id) DO UPDATE SET status=excluded.status, reason=excluded.reason,
      since=excluded.since, fetched_at=excluded.fetched_at
  `).run(status, reason, since, new Date().toISOString());

  return status;
}

export async function runScraper() {
  console.log('[scraper] starting...');

  // National feeds
  try {
    const wh = await scrapeWhiteHouse();
    console.log(`[scraper] whitehouse.gov: ${wh} new`);
  } catch (err) {
    console.error('[scraper] whitehouse.gov error:', err.message);
  }
  try {
    const fr = await scrapeFederalRegister();
    console.log(`[scraper] federalregister.gov: ${fr} new`);
  } catch (err) {
    console.error('[scraper] federalregister.gov error:', err.message);
  }

  // CT dedicated page scraper
  try {
    const ctStatus = await scrapeCtPage();
    console.log(`[scraper] CT page: ${ctStatus}`);
  } catch (err) {
    console.error('[scraper] CT page error:', err.message);
  }

  // State feeds — run concurrently, cap at 5 at a time to be polite
  const results = [];
  for (let i = 0; i < STATE_FEEDS.length; i += 5) {
    const batch = STATE_FEEDS.slice(i, i + 5);
    const settled = await Promise.allSettled(batch.map(s => scrapeState(s)));
    for (let j = 0; j < batch.length; j++) {
      const r = settled[j];
      if (r.status === 'fulfilled' && r.value > 0) {
        results.push(`${batch[j].state}:+${r.value}`);
      } else if (r.status === 'rejected') {
        console.error(`[scraper] ${batch[j].state} error: ${r.reason?.message}`);
      }
    }
  }
  if (results.length) console.log(`[scraper] states: ${results.join(' ')}`);
  console.log('[scraper] done.');
}
