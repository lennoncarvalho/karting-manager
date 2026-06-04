# Feature Specification: Generated Supabase DB Types

**Feature Branch**: `011-generated-db-types`
**Created**: 2026-06-03
**Status**: Planned — deferred
**Depends on**: spec 010 (Angular rewrite)
**Input**: Resolve Suggestion #5 from `app/IMPLEMENTATION-STATUS.md`. Replace the hand-maintained TypeScript interfaces in `app/src/app/core/models.ts` with a thin facade over Supabase-generated DB types so the Postgres schema becomes the single source of truth.

---

## 1. Goal

Generate a `Database` TypeScript definition directly from the live Supabase Postgres schema and have the Angular app consume it through a slim facade in `app/src/app/core/models.ts`. Eliminate the risk of `models.ts` drifting from the actual database.

## 2. Motivation

- Today, `app/src/app/core/models.ts` is hand-written. Any schema change (new column, renamed field, nullable flip) must be mirrored manually.
- Compile-time guarantees on row shape are currently best-effort. With generated types, every Supabase select/insert/update payload becomes precisely typed end-to-end.
- Aligns the app with the wider Supabase ecosystem convention (`supabase gen types typescript`).

## 3. Scope

### In scope

- A generated TypeScript file containing the full `Database` definition for the `public` schema.
- A thin facade file (`core/models.ts`) that re-exports semantic aliases (`Season`, `Cup`, `Driver`, `Race`, `RaceResult`, `Penalty`, `RaceResultLog`) plus any project-specific augmentations (e.g. `STANDARD_PENALTY_POINTS`).
- A `prebuild` script wired into `app/package.json` that regenerates types when the schema changes (manual trigger or CI step).
- Documentation in `app/README.md` explaining how to regenerate types locally.

### Out of scope

- Changing any business logic.
- Switching the Supabase JS SDK version.
- Generating types for schemas other than `public`.
- Editing the Supabase database schema itself.

## 4. Inputs

- Live Supabase project (production or branch).
- Either the Supabase project ref + an access token, **or** a local Supabase CLI link.
- The existing `core/models.ts` file as a reference for the semantic aliases needed.

## 5. Generation Command

Two equivalent invocation paths must be supported and documented:

1. **Project-ref + token** (CI-friendly):
   ```bash
   npx supabase gen types typescript \
     --project-id "$SUPABASE_PROJECT_REF" \
     --schema public \
     > app/src/app/core/database.types.ts
   ```
2. **Linked local CLI** (developer-friendly):
   ```bash
   supabase login
   supabase link --project-ref "$SUPABASE_PROJECT_REF"
   supabase gen types typescript --linked --schema public \
     > app/src/app/core/database.types.ts
   ```

The output file `app/src/app/core/database.types.ts` is **generated**. It must carry a header comment `// AUTO-GENERATED — do not edit by hand.` and be reformatted by the project's Prettier/ESLint configuration.

## 6. Facade Pattern in `core/models.ts`

`core/models.ts` becomes a thin re-export layer:

```ts
import type { Database } from './database.types';

type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
type Insert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
type Update<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Season       = Row<'seasons'>;
export type SeasonInsert = Insert<'seasons'>;
export type SeasonUpdate = Update<'seasons'>;
// …repeat for Cup, Driver, Race, RaceResult, Penalty, RaceResultLog

// Project-specific augmentations stay hand-written:
export const STANDARD_PENALTY_POINTS = { /* … */ } as const;
```

Joined-row shapes used by `ApiService` (e.g. `RaceResult` with `drivers` + `penalties` embedded) live in a separate `joined.ts` companion file so the generated types stay untouched and the facade stays clean.

## 7. `prebuild` Script Outline

Add to `app/package.json`:

```json
{
  "scripts": {
    "supabase:types": "supabase gen types typescript --linked --schema public > src/app/core/database.types.ts",
    "supabase:types:ci": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF --schema public > src/app/core/database.types.ts"
  }
}
```

`supabase:types` is run **manually** before committing schema changes. It is **not** auto-invoked by `prebuild` for normal builds — schema regen needs network access and credentials, which CI builds may not have. A guard in CI verifies that `database.types.ts` was regenerated when a migration file under `kartarados/specs/**/migration-*.sql` changed.

## 8. CI Environment Requirements

- `SUPABASE_PROJECT_REF` exposed as a CI secret.
- `SUPABASE_ACCESS_TOKEN` exposed as a CI secret (required by `supabase gen types`).
- The CI job that runs `supabase:types:ci` runs on push to `main` and on schema-change PRs; the resulting diff is committed back automatically (or fails the build if drift is detected).

## 9. Rollout Steps

1. Add `supabase` CLI dev-dependency (or document `npx supabase` usage).
2. Run `npm run supabase:types` locally; commit `database.types.ts`.
3. Refactor `core/models.ts` to the facade pattern above.
4. Move joined-row types (`RaceResult` with `drivers`/`penalties`) into `core/joined.ts`.
5. Fix any TypeScript errors that surface from stricter generated types.
6. Update `app/README.md` with the regeneration workflow.
7. Add CI step to detect schema drift.

## 10. Acceptance Criteria

- **AC-01** `app/src/app/core/database.types.ts` exists, is generated, and matches the live `public` schema.
- **AC-02** `core/models.ts` no longer hand-declares row column lists; it re-exports `Row<'…'>`/`Insert<'…'>`/`Update<'…'>` aliases from `database.types.ts`.
- **AC-03** All existing imports of `Season`, `Cup`, `Driver`, `Race`, `RaceResult`, `Penalty`, `RaceResultLog` continue to compile with no change at call sites.
- **AC-04** `npm run supabase:types` regenerates the file with zero hand-edits required afterwards.
- **AC-05** CI fails when a migration is added without a corresponding regeneration of `database.types.ts`.
- **AC-06** `app/README.md` documents both the project-ref+token and the linked-CLI regeneration paths.

## 11. Status

**Planned — deferred.** Implementation will be scheduled after the v2 feature port (spec 010) is fully closed. Captured here so the decision and design are not lost.
