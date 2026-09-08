# Us, Later

A mobile-first relationship + executive-function PWA for ADHD couples.

The product idea: a shared mental inbox that catches all the tiny things two people mean to do, say, remember, decide or follow up on — then resurfaces only a few useful things at a time.

## What works in this MVP

- **Mental inbox** — dump a thought in one line. Simple local categorisation files it as a chore, conversation, date, reminder or decision.
- **Tonight's three** — intentionally avoids a giant overdue list and surfaces only three open items.
- **Parallel ownership** — unassigned tasks say “Needs an owner” rather than blaming one partner.
- **Couple body-doubling** — built-in 20-minute shared boring-stuff timer.
- **Don't discuss this right now** — capture a relationship issue and park it until later.
- **Repair mode** — two short private prompts become a calmer conversation opener.
- **Dopamine dates** — generates a low-planning activity from energy, budget and time.
- **Object-location memory** — save where passports, keys, bags and other easily-misplaced things live.
- **Recurring-life autopilot** — recurring household responsibilities with neutral ownership.
- **Fairness signals** — shows patterns in planning/remembering/booking/follow-up without turning the relationship into a scoreboard.
- **Installable PWA** — designed for iPhone Safari “Add to Home Screen”.
- **Offline shell** — a lightweight service worker caches the app shell.

## Important MVP limitation

This version stores data in `localStorage`, so it is **local to one browser/device**. That keeps the GitHub Pages version zero-config and immediately usable.

For a real couple using separate phones, add authentication + a small shared database. Supabase is a good fit because it can provide email/magic-link auth, Postgres and realtime sync while the frontend can still live on GitHub Pages.

A practical next schema would be:

```sql
create table couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  created_at timestamptz default now()
);

create table couple_members (
  couple_id uuid references couples(id) on delete cascade,
  user_id uuid not null,
  display_name text,
  primary key (couple_id, user_id)
);

create table inbox_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  text text not null,
  category text not null,
  owner text not null default 'Unowned',
  created_by uuid,
  invisible_labour text,
  deferred_until timestamptz,
  done boolean default false,
  created_at timestamptz default now()
);
```

Before using real relationship data, enable Row Level Security and write policies that only let members of a couple read/write that couple's rows.

## Run locally

Requirements: Node 20+

```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

## Build

```bash
npm run build
npm run preview
```

## Put it on GitHub

1. Create a new empty GitHub repository, for example `us-later`.
2. Put these files in the repository.
3. Run:

```bash
git init
git add .
git commit -m "Initial Us, Later MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/us-later.git
git push -u origin main
```

4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions** as the source.
6. The included `.github/workflows/deploy.yml` will build and publish the site whenever you push to `main`.

## Install on iPhone

Once your GitHub Pages site is live:

1. Open the site in **Safari** on the iPhone.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Launch **Us, Later** from the new home-screen icon.

## Product direction I would build next

1. Supabase couple accounts + invite links.
2. Realtime inbox sync between both phones.
3. Push notifications and “capacity windows” instead of ordinary due dates.
4. A more sophisticated ranking model for “tonight's three”.
5. Private-by-default repair answers with explicit reveal controls.
6. A weekly invisible-work reflection that shows trends, never points.
7. Calendar-aware resurfacing (for example, bring up “ask Sam about Christmas” before seeing Sam).
8. Optional on-device/hosted AI categorisation with a deterministic fallback.

## Design notes

The UI intentionally uses warm, low-contrast surfaces, neutral ownership language, low item density and large touch targets. The product should feel like a shared external brain, not a compliance dashboard.
