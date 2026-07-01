# Fammy

Minimal PWA for couple todo & agenda. English UI, offline-first, Google Sheets as database.

**Current version:** `1.9.0` (badge in app header) — full history in [VERSION_LOG.md](./VERSION_LOG.md).

## Features

- **Today** — todos with Shared / Personal filter (count badge per tab) + add task form
- **Agenda** — event calendar; set visibility, repeat & reminder when creating events
- **All** — all tasks you can see, grouped: **To Do**, Today, Tomorrow, **Agenda**, Done
- **Settings** (gear icon) — push notifications, test notification, reset data, log out
- **Shared** tasks visible to both; **Personal** tasks only visible to creator
- Offline-first (IndexedDB + sync queue), swipe to complete/delete, tap task for details
- Sync survives background resume (mutex, network timeout, IndexedDB recovery)

Tab navigation uses **bottom nav** + **client shell** — instant tab switches without server round-trips. No large page titles; tab names in bottom nav are enough.

### Recurring agenda

- Calendar shows **virtual indicator dots** on future dates per repeat pattern (daily / weekly / monthly / custom) — UI preview, not separate database rows
- In the database, the parent task **advances to the next date** after the event time passes (hourly cron)
- Agenda list below calendar: **real** tasks + future occurrences as **Preview** (read-only, not in database yet)

### Data retention

- Completed todos (>48 hours) are auto-deleted from the Sheet (shared & personal)
- Agenda/events are kept even after completion
- **Delete all tasks** in Settings → Data — permanent reset of all todos & events (you + partner), cannot be undone

## Notifications (Web Push)

Requires iOS 16.4+ and app installed to **Home Screen** (not Safari tab). Enable via **Settings** → *Push notifications* toggle.

| Type | When | Who receives |
|------|------|--------------|
| Daily digest | At `digestHour` (`APP_TIMEZONE`) | All subscribers |
| Event reminder | `remindBefore` minutes before `dueTime` (default 30 min) | Subscribers who can view the event |
| New shared task/event | When partner creates a **Shared** task | **Partner only** (not creator) |
| Shared task/event done | When partner marks **Shared** task complete | **Partner only** (not completer) |

When creating an event, set **Reminder** in *More Details* (event time required for push). Instant test notification available in Settings. Check `push_subscriptions` tab in Sheet to verify device registration.

## Stack

- Next.js 16 + TypeScript + Tailwind
- Auth.js (Google OAuth, email allowlist)
- Google Sheets API (service account)
- Dexie (IndexedDB offline cache)
- Serwist (PWA + push)
- Vercel Pro (cron jobs)

## Setup

### 1. Google Cloud

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Sheets API**
3. Create **OAuth 2.0 Client ID** (Web) for user login
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
4. Create **Service Account**, download JSON key
5. Create empty Google Sheet, share with service account email (Editor)

### 2. Environment

```bash
cp .env.example .env.local
```

Fill all variables. Generate secrets:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # CRON_SECRET
npm run generate:vapid
```

| Variable | Description |
|----------|-------------|
| `ALLOWED_EMAILS` | Couple emails, comma-separated (max 2 accounts) |
| `GOOGLE_SHEET_ID` | ID from Google Sheet URL |
| `VAPID_*` | Web Push keys |
| `CRON_SECRET` | Cron endpoint protection |
| `APP_TIMEZONE` | Optional, default `Asia/Jakarta` — timezone for digest, reminders & recurring |

### 3. Init Sheet

```bash
npm install
npm run setup:sheet
```

Creates tabs: `tasks`, `push_subscriptions`, `settings`.

### 4. Development

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy Vercel Pro

1. Push to GitHub, import on Vercel
2. Set all env vars (including `CRON_SECRET`, `VAPID_*`, `APP_TIMEZONE`)
3. Deploy — cron jobs register automatically from `vercel.json`
4. Update OAuth redirect URI to production domain

## iOS Push Notifications

1. Open Fammy in Safari
2. Tap Share → **Add to Home Screen**
3. Open app from Home Screen icon (not Safari tab)
4. Tap **gear** icon → enable **Push notifications**
5. Optional: tap **Send** under *Test notification* to verify

Push does not work in regular Safari — only from installed PWA. If notifications are blocked, open iPhone **Settings → Fammy → Notifications**.

## Google Sheet

### Tabs

| Tab | Contents |
|-----|----------|
| `tasks` | All todos & events |
| `push_subscriptions` | Devices subscribed to push |
| `settings` | App config (`digestHour`, `digestMinute`, etc.) |

### Task columns (important)

| Column | Values |
|--------|--------|
| `type` | `todo` or `event` |
| `visibility` | `shared` or `private` |
| `repeat` | `none`, `daily`, `weekly`, `monthly`, `custom` |
| `repeatInterval` | Days (only for `custom`, e.g. 14) |
| `remindBefore` | Minutes before `dueTime` (event, default 30) |
| `dueDate` / `dueTime` | `YYYY-MM-DD` / `HH:mm` |

### Manual edit

- Do not change the `id` column
- Deleting via app **removes the row** from Sheet. For manual edits, safer to set `deleted` to `true` than delete rows.

### Settings (optional)

In `settings` tab, add rows:

| key | value | Description |
|-----|-------|-------------|
| `digestHour` | `7` | Daily digest hour (`APP_TIMEZONE`) |
| `digestMinute` | `0` | Daily digest minute |

## Cron Jobs

All event/reminder/recurring schedules use `APP_TIMEZONE` (default WIB).

| Path | Schedule (UTC) | Function |
|------|----------------|----------|
| `/api/cron/digest` | Every hour (`0 * * * *`) | Send digest when hour = `digestHour` |
| `/api/cron/reminders` | Every minute | Event reminders (`remindBefore` min before `dueTime`) |
| `/api/cron/recurring` | Every hour (`0 * * * *`) | Advance recurring events after event time passes |
| `/api/cron/cleanup` | Every hour (`0 * * * *`) | Delete completed todos (>48h) from Sheet |

Vercel cron sends header `Authorization: Bearer $CRON_SECRET` — verified on each route.

**Note:** Per-minute cron requires **Vercel Pro**. HTTP `200` does not mean push was delivered — check response body (`notified`, `skipped`, etc.) and verify subscriptions in Sheet. Shared task notifications (create/complete) are sent on sync, not via cron.

## Versioning

| File | Role |
|------|------|
| [`VERSION_LOG.md`](./VERSION_LOG.md) | Changelog per release + GitHub commit links |
| [`src/lib/version.ts`](./src/lib/version.ts) | Active version (`APP_VERSION`) — shown in header |
| [`AGENTS.md`](./AGENTS.md) | AI agent cheat sheet + `git push` workflow |

**MAJOR.MINOR.PATCH** scheme: major = big changes; minor = new features; patch = bugfix / UI polish.

After a new release: update `APP_VERSION`, add entry to `VERSION_LOG.md`, commit & push.

## Scripts

```bash
npm run dev            # Development
npm run build          # Production build (+ generate icons)
npm run setup:sheet    # Init Google Sheet tabs
npm run generate:vapid # Generate VAPID keys for push
```
