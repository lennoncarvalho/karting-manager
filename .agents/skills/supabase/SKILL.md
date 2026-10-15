---
name: supabase
description: Use Supabase (Auth, PostgreSQL, Storage) as the sole backend for the Kartarados app. TRIGGER when wiring auth, designing tables, writing RLS policies, querying with `@supabase/supabase-js`, optimizing reads (selects/joins/caching), uploading driver pictures to Storage, or writing migrations. The Angular client uses anon-key only and depends on RLS for safety.
---

# Supabase Skill

This skill encodes the backend rules for the Kartarados rewrite. The app is a static SPA — **all** persistence and auth go through Supabase.

## Core Rules

1. **One project, one schema** (`public`).
2. **Anon key in the browser**: The Angular app uses only the `anon` key. Service-role keys must NEVER ship to the client.
3. **RLS is mandatory** on every table. The anon key is essentially "the internet" — without RLS the database is fully open.
4. **Auth is email/password** via Supabase Auth. Admins are created **directly in the Supabase dashboard** (no in-app admin invitation UI).
5. **Schema migrations**: keep a versioned folder `kartarados/supabase/migrations/NNN_*.sql` checked into git. Apply via Supabase SQL editor or `supabase db push`.
6. **No Edge Functions** unless absolutely required (the current app has none and works fine).
7. **Storage**: driver pictures live in a public bucket `driver-pictures`. URLs are stored in `drivers.picture_url`.

## Client Setup (Angular)

`SupabaseService` is a thin singleton:

```ts
// core/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      db: { schema: 'public' },
    }
  );
}
```

All domain services (`SeasonService`, `RaceService`, …) depend on `SupabaseService` and never construct their own client.

## Auth

```ts
const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
```

- Use `onAuthStateChange` once at app boot to update an `AuthStore` signal.
- Guard admin routes with a functional `authGuard` that checks the current session.
- Password changes via `supabase.auth.updateUser({ password })`.

## Querying — Single Source of Truth

Every list method follows the same shape (mirrors today's `api.js`):

```ts
async listRaces(opts: { seasonId?: string; cupId?: string }) {
  let q = this.supabase.client
    .from('races')
    .select('*')
    .order('race_datetime', { ascending: true });
  if (opts.seasonId) q = q.eq('season_id', opts.seasonId);
  if (opts.cupId) q = q.eq('cup_id', opts.cupId);
  const { data, error } = await q;
  if (error) throw new Error(this.translate(error));
  return data;
}
```

### Joins

Use Supabase's embedded foreign-table syntax to avoid N+1:

```ts
.select('*, drivers(*), penalties(*)')
```

The rankings page must fetch `race_results` for a season with **one** call:

```ts
.from('race_results')
.select('*, drivers(*), penalties(*)')
.in('race_id', raceIdsForSeason)
```

This is currently in `listRaceResultsByRaceIds` and must be preserved.

### Caching (localStorage)

Cache low-churn, large-impact reads:

- `seasons` list — `seasonsCache` key (sorted by end_date desc).
- `seasons by id` — `seasonsCacheById` map.

Cache rules:

- Read cache first when called with no custom filters.
- Write cache on every successful create/update; remove on delete.
- Never cache `race_results` or `penalties` (volatile + per-page).
- Cache key prefix: `kt:` (e.g. `kt:seasonsCache`) to avoid collisions with other tools.

Preload the active season's accent color via the `kt:activeSeason` key BEFORE Angular bootstraps so the navbar/footer doesn't flash a wrong color.

## Row Level Security (RLS) — Required Policies

Enable RLS on every table, then add:

```sql
-- Public read everywhere needed for the rankings page:
create policy "public read seasons" on seasons for select using (true);
create policy "public read cups" on cups for select using (true);
create policy "public read races" on races for select using (true);
create policy "public read drivers" on drivers for select using (true);
create policy "public read race_results" on race_results for select using (true);
create policy "public read penalties" on penalties for select using (true);

-- Admin writes (any authenticated user is considered an admin in this app):
create policy "admin write seasons" on seasons for all
  to authenticated using (true) with check (true);
-- repeat for cups, races, drivers, race_results, penalties

-- race_results_log audit table:
-- inserts only by authenticated users; never readable by anon
create policy "admin insert log" on race_results_log for insert
  to authenticated with check (true);
create policy "admin read log" on race_results_log for select
  to authenticated using (true);
```

If/when admins need to be distinguished from "any logged-in user", add a `profiles` table with a `role` column and adjust `using` clauses.

## Audit Log (race_results_log)

Spec 009 (production hardening) added an audit log. The pattern:

1. Before any `update` or `delete` on `race_results`, the client SELECTs the current row.
2. Inserts that row + `changed_by_user_id` into `race_results_log`.
3. Then performs the actual update/delete.

Schema:

```sql
create table race_results_log (
  id uuid primary key default gen_random_uuid(),
  race_result_id uuid,
  race_id uuid,
  driver_id uuid,
  finish_position int,
  grid_start_position int,
  best_lap_time text,
  is_disqualified boolean,
  comments text,
  created_at timestamptz,
  updated_at timestamptz,
  changed_by_user_id uuid,
  logged_at timestamptz default now()
);
```

(Optionally enforce this server-side with a Postgres trigger so a careless client can't skip the log. The current code does it client-side — both are acceptable but trigger is safer.)

## Foreign Keys & Cascades

- `races.season_id` → `seasons.id` (RESTRICT, prevent delete with races)
- `races.cup_id` → `cups.id` (CASCADE delete races when cup is deleted — current behaviour)
- `cups.season_id` → `seasons.id` (CASCADE)
- `race_results.race_id` → `races.id` (CASCADE)
- `race_results.driver_id` → `drivers.id` (**CASCADE** — was changed from RESTRICT in spec 004 to allow driver deletion to wipe their results)
- `penalties.race_result_id` → `race_results.id` (CASCADE)

## Storage

Bucket: `driver-pictures`

- Public read.
- CORS must allow GET/HEAD from app origins (Cloudflare Pages domain + localhost dev).
- Path convention: `drivers/<driver-id>/<timestamp>.<ext>`.
- The Angular `DriverService.uploadPicture()` calls `supabase.storage.from('driver-pictures').upload(...)` then `getPublicUrl(...)` and stores the URL in `drivers.picture_url`.
- Old pictures should be removed on successful replace.

## Performance Tips

1. **Always `.select(specific_columns)`** when listing — avoid `select('*')` for big tables (we still do `*` today because rows are small; reconsider if rows grow).
2. **Index every foreign key** and every column used in `.order()` or `.eq()` filters. Supabase creates FK indexes for you; verify in the dashboard.
3. **Batch reads** using `.in('id', [...])` instead of N round-trips (see `listRaceResultsByRaceIds`).
4. **`.range()` pagination** for tables that grow unbounded (race_results_log).
5. **Avoid `count: 'exact'`** unless you need it — it does an extra count query.
6. **`single()` vs `maybeSingle()`**: use `maybeSingle()` whenever 0 rows is a valid outcome (no throw).

## Real-time

Currently unused. If added, subscribe via `.channel('race_results').on('postgres_changes', …)`. Be aware:

- Real-time uses a separate WebSocket connection.
- Subscriptions are billed separately on hosted Supabase free tier.
- For a rankings page that doesn't need sub-second updates, **don't** use real-time; just refetch on user action.

## Gotchas

1. **Anon key + RLS-off table = full data leak.** Verify RLS is on for every table after every migration.
2. **`auth.uid()`** is null for anon users — write policies defensively (`auth.role() = 'authenticated'` etc.).
3. **Time zones**: `timestamptz` is what we use everywhere. Always send ISO strings.
4. **`onAuthStateChange` fires synchronously at boot** with the persisted session — make sure your `AuthStore` is created before any guard runs.
5. **CORS on Storage** — easy to forget and silently breaks images. Configure in the Storage section of the dashboard.
6. **Migrations and Supabase Auth dashboard users**: creating a user in the dashboard does NOT create a row in your own `profiles` / `admins` tables. If you keep an `admins` table, use a trigger or do it manually.
7. **`upsert` requires a unique constraint** on the conflict columns or it falls back to inserting duplicates.
8. **Schema drift**: keep migrations idempotent or numbered; never edit the DB through the dashboard without writing the equivalent SQL into the migrations folder.

## Reference Links

- Supabase JS docs: https://supabase.com/docs/reference/javascript
- RLS guide: https://supabase.com/docs/guides/auth/row-level-security
- Storage: https://supabase.com/docs/guides/storage
- PostgREST filters: https://docs.postgrest.org/en/stable/references/api/tables_views.html
