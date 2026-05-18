import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'flag.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS proclamations (
    id         TEXT PRIMARY KEY,
    scope      TEXT,
    state      TEXT,
    status     TEXT,
    reason     TEXT,
    since      TEXT,
    expires    TEXT,
    source     TEXT,
    fetched_at TEXT
  )
`);

export default db;
