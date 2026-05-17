# Talebe Tracker

A calm, beautiful web app for Islamic student groups to track daily worship goals together. Leaders create groups and contests; students join with an invite code and log their day in a few taps.

- **5 daily prayers** with cemaat (congregation) toggle
- **Sunnah & nafl**: Tahajjud, Duha, Evvabin
- **Counts**: Quran pages, Zikr count, Book reading pages
- **Contests** with custom date ranges + scoring + leaderboards
- **Streaks** for personal motivation
- **No accounts** for students — just an invite code + their name
- **Apple-inspired liquid glass** UI in a cream / white / brown palette

Built with Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Vercel Postgres / Neon · bcryptjs · jose.

---

## Quick local setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Provision a free Postgres**
   - Easiest: create a free [Neon](https://neon.tech) project, or
   - Use [Vercel Postgres](https://vercel.com/postgres) (Neon under the hood).
   - Grab the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`).

3. **Create `.env.local`** in the project root:
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   SESSION_SECRET=<run: openssl rand -base64 32>
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```
   This runs [schema.sql](schema.sql) against your DB. Re-running it is safe (uses `CREATE TABLE IF NOT EXISTS`).

5. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

---

## Deploying to Vercel

1. Push this folder to a GitHub repo.

2. In Vercel: **Add New → Project → Import** that repo. Framework auto-detects as Next.js.

3. **Add storage** (still inside the Vercel project):
   - Storage tab → Create Database → **Postgres** (free Hobby tier).
   - Vercel auto-injects `DATABASE_URL` (plus a few aliases). Our app only reads `DATABASE_URL`.
   - If you'd rather use Neon directly, just add the env var manually.

4. **Add `SESSION_SECRET`** in Project Settings → Environment Variables. Generate one with:
   ```bash
   openssl rand -base64 32
   ```
   Apply to Production, Preview, and Development.

5. **Initialize the schema** once. Two options:
   - Easiest: in the Vercel Postgres dashboard, open the **Query** tab and paste the contents of [schema.sql](schema.sql), then run.
   - Or locally: pull env vars (`vercel env pull .env.local`), then `npm run db:init`.

6. Deploy. Done.

---

## How it works

### Identity model

- **Students** have **no accounts**. They enter the group code + their name, and we issue a signed session cookie. If they switch devices, they re-enter the same code + name and pick up their data. (Identity is honor-system within the group — appropriate for a small student halaqa.)
- **Leaders** authenticate per group with a **passphrase** set at group creation. Stored as a bcrypt hash. The leader session cookie is a signed JWT.

### Sessions

Cookies are signed with HMAC-SHA256 using `SESSION_SECRET`. Two cookies:
- `talebe_student` — student session
- `talebe_leader` — leader session

Both expire after 30 days.

### Smart defaults

When a student opens "Today" for the first time, the 5 daily prayers are pre-marked done. They only tap to mark **misses** + add **cemaat**, optional prayers, and any Quran/zikr/book counts. Auto-saves on every change (debounced 600ms).

### Contests

A leader sets a name, date range, and points-per-habit. The leaderboard pulls all entries from group members whose `entry_date` falls in the contest's window, sums points, and ranks descending. Counts (Quran pages, zikr, book) multiply by the per-unit point value.

---

## Project layout

```
app/
├── page.tsx                            landing
├── student/
│   ├── join/page.tsx                   enter code + name
│   ├── today/page.tsx                  daily tracker (main)
│   ├── stats/page.tsx                  streaks + 30-day heatmap
│   └── contests/
│       ├── page.tsx                    list
│       └── [id]/page.tsx               contest leaderboard
├── leader/
│   ├── page.tsx                        sign in / create group
│   ├── dashboard/page.tsx              members list + group code
│   ├── members/[id]/page.tsx           one member's 60-day history
│   └── contests/
│       ├── page.tsx                    list + create modal
│       └── [id]/page.tsx               contest detail + delete
└── api/
    ├── groups/{create,login,logout}/
    ├── students/{join,logout}/
    ├── entries/                        GET/PUT today's entry
    ├── entries/history/                GET last N days
    ├── contests/                       GET list, POST create
    ├── contests/[id]/                  GET detail+leaderboard, DELETE
    ├── leader/members/                 GET roster with last entry
    ├── leader/members/[id]/            GET history, DELETE student
    └── me/                             current session info

components/    GlassCard, Button, Input, Header, TabBar, PrayerRow, HabitToggle, Stepper
lib/           db, session, codes (invite-code generator), types
scripts/       init-db.mjs  (runs schema.sql)
schema.sql     full DB schema (idempotent)
```

---

## Notes / caveats

- **Free hosting:** Vercel Hobby + Neon Free comfortably hosts a small halaqa group at $0/month.
- **No password resets for leaders.** Don't lose the passphrase. (Pragmatic for a small group app; can be added if needed.)
- **Time zones:** dates are stored as the server's `CURRENT_DATE`. For most use cases this is fine; if your group spans many time zones, you may want to switch to a user-local date.
- **No mocks for prayers:** the app trusts the student's input — by design. Group accountability is the social layer.
