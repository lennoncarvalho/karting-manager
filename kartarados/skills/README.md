# Kartarados Project Skills

Project-level skill documents that encode the conventions and gotchas for the Kartarados Angular rewrite. AI agents working on this codebase should read the matching SKILL.md whenever a task touches that domain.

| Skill | Folder | When to use |
|---|---|---|
| Angular | [`angular/`](./angular/SKILL.md) | Anything in `frontend/src/app/` — components, directives, services, routing, signals, i18n. |
| Bootstrap | [`bootstrap/`](./bootstrap/SKILL.md) | Layout, styling, forms, modals, responsive design, theming via `--kt-season-accent`. |
| Supabase | [`supabase/SKILL.md`](./supabase/SKILL.md) | Auth, queries, RLS, Storage uploads, migrations, audit log, caching strategy. |

## Reading order for a new contributor

1. Read the unified spec at [`../specs/010-angular-rewrite/spec.md`](../specs/010-angular-rewrite/spec.md).
2. Read each SKILL.md above, in order: Angular → Bootstrap → Supabase.
3. Skim the historical specs `001` through `009` only for context — `010` supersedes them.
