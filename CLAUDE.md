# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Install all dependencies (run from root):**
```bash
npm install
```

**Backend (from `backend/`):**
```bash
npm run dev    # Development with auto-reload (Node --watch)
npm start      # Production
```

**Frontend app (from `app/`):**
```bash
npm start      # Expo dev server (interactive)
npm run web    # Web browser
npm run ios    # iOS simulator
```

Backend runs on `http://localhost:3001`. There is no test suite yet.

## Tool choice rules

- **Checking URLs or HTTP status codes**: use a `curl` loop in Bash — never spawn an agent or use WebFetch for this. A shell loop over 30 URLs takes ~30 seconds and zero tokens.
- **Before starting any research task touching 10+ items**: pause and ask "can a shell script do this?" If yes, write the script. Only use an agent if the task requires judgment or interpretation per item.
- **Progress**: for any loop over more than 5 items, print `[i/total]` progress on each iteration.

## Architecture

This is an npm workspaces monorepo with two packages: `backend/` and `app/`.

### Backend (`backend/src/`)

Node.js ≥20 (ESM) + Fastify server. SQLite (`better-sqlite3`) stores all proclamations in a single `proclamations` table in `backend/data/flag.db`.

- **`index.js`** — Fastify server, CORS, API routes, and a `node-cron` job that scrapes every 30 minutes.
- **`db.js`** — SQLite setup and schema.
- **`scraper.js`** — Fetches and parses 4 source types: White House RSS, Federal Register RSS, a Connecticut-specific HTML page, and governor RSS feeds for 18 states. Scrapes state feeds in parallel batches of 5.
- **`states.js`** — RSS feed URLs for each supported state.
- **`statutory.js`** — Hard-coded federal law dates (4 U.S.C. § 7): Peace Officers Memorial Day, Memorial Day, Patriot Day, Pearl Harbor Day.

**Only endpoint:** `GET /api/status?state=XX` — combines statutory rules, scraped proclamations, and a full-staff default, then returns `{ national, state, effective, effectiveReason }`. Priority: statutory dates > active proclamations > full staff.

**Half-staff logic:** if either national OR state is half-staff, `effective` is `"half"`.

### Frontend (`app/`)

React Native + Expo (cross-platform: iOS, Android, Web). Metro is configured in `metro.config.js` to resolve `node_modules` from the monorepo root.

- **`App.js`** — Main component. Detects user state via geolocation (Nominatim reverse-geocode on web, `expo-location` on mobile). Polls `/api/status`. Renders status cards and the next 3 upcoming statutory dates.
- **`FlagPole.js`** — Animated SVG flag pole. Flag slides between full and half positions with a 1.4s cubic-bezier transition. Draws a complete 13-stripe flag with a 49-star canton.

### Data Flow

```
Scraper (every 30min) → SQLite proclamations table
                                    ↓
GET /api/status → merge statutory + DB + default → JSON response
                                    ↓
                        App.js (React Native) → FlagPole.js animation
```
