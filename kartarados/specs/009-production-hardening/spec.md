# Feature Specification: Production Hardening (Security, Performance, Privacy)

**Feature Branch**: `009-production-hardening`
**Created**: 2026-03-12
**Status**: In progress
**Input**: Pre-production adjustments: minify/uglify in build (Cloudflare Pages), prevent race_results tampering (auth + audit log), and prevent double-triggering of buttons during AJAX (loading backdrop + wait cursor).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Production build minification (Priority: P1)

As a deployer, I want the production build to minify and bundle frontend assets so that the app is smaller, faster to load, and source code is not easily readable (security through obscurity as a layer).

**Why this priority**: Performance and a basic layer of obfuscation for production.

**Acceptance Scenarios**:

1. **Given** the build script is run with required env vars, **When** the build completes, **Then** JS (and optionally CSS) is minified and output to a production directory (e.g. `dist/`).
2. **Given** the app is deployed to Cloudflare Pages, **When** the build command runs (e.g. `./build.sh` from frontend), **Then** config injection and minification both run; publish directory is the build output.
3. **Given** development workflow, **When** developers serve the app without building, **Then** they can still use unminified sources (e.g. `src/`) for debugging.

---

### User Story 2 - Race results tampering prevention (Priority: P1)

As an operator, I want only authenticated admins to modify race results, and I want an audit trail so that every change is logged (the previous row state is saved to an audit log table before any update or delete).

**Why this priority**: Integrity of championship data and accountability.

**Acceptance Scenarios**:

1. **Given** RLS is enabled on `race_results`, **When** a non-admin or unauthenticated user attempts INSERT/UPDATE/DELETE, **Then** the operation is denied.
2. **Given** a `race_results_log` audit table exists, **When** an admin edits a result from the UI, **Then** the previous row state (all columns + the authenticated user UUID) is saved to `race_results_log` before the update is applied in-place.
3. **Given** a `race_results_log` audit table exists, **When** an admin deletes a result from the UI, **Then** the previous row state is saved to `race_results_log` before the row is physically deleted.
4. **Given** penalties reference `race_result_id`, **When** a result is updated in-place, **Then** the row ID is preserved so penalty foreign keys remain valid without re-association.

---

### User Story 3 - No double-triggering of actions (Priority: P1)

As a user, I want to be unable to trigger the same action multiple times while a request is in progress, and I want clear feedback (e.g. loading overlay and wait cursor) so I know the app is working.

**Why this priority**: Prevents duplicate submissions, duplicate race results, and confusion.

**Acceptance Scenarios**:

1. **Given** any button or form submit that triggers an AJAX/API call, **When** the user clicks/submits, **Then** the button (or whole UI) is guarded so that a second click does not fire another request until the first completes.
2. **Given** an in-flight request, **When** the user sees the screen, **Then** a loading backdrop (and optionally spinner) and `cursor: wait` are shown so it is clear that the app is busy.
3. **Given** the request completes (success or error), **When** the overlay is dismissed, **Then** buttons become clickable again and the user can retry or continue.

---

## Out of Scope (for this spec)

- Content Security Policy (CSP) or other security headers (can be a follow-up).
- Rate limiting or abuse protection (backend/Supabase).
- Privacy-specific items (e.g. PII handling, consent) unless already required by existing policy.

## Technical Notes

- **Build**: Current `build.sh` injects config into `frontend/src/config.js`. Minification should run after config injection, with build output suitable for Cloudflare Pages (e.g. `frontend/dist`).
- **Race results**: Existing RLS already restricts write to admins. Audit trail: a `race_results_log` table mirrors the `race_results` columns plus a `changed_by_user_id` UUID column. Before any update or delete, the app saves the previous row state to `race_results_log` with the authenticated user's UUID. Updates are applied in-place (row ID preserved); deletes are physical. The `race_results` table keeps `created_at` and `updated_at` columns for traceability.
- **Loading**: A single global overlay component or helper that wraps async handlers and shows/hides backdrop + cursor.
