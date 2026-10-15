# Kartarados Project Skills

Project-level skill documents that encode the conventions and gotchas for the Kartarados app. AI agents working on this codebase should read the matching SKILL.md whenever a task touches that domain.

| Skill | Folder | When to use |
|---|---|---|---|
| React Best Practices | [`react-best-practices/`](./react-best-practices/SKILL.md) | React and Next.js performance optimization — data fetching, bundle size, re-render optimization, rendering performance, and advanced patterns. |
| Supabase | [`supabase/SKILL.md`](./supabase/SKILL.md) | Auth, queries, RLS, Storage uploads, migrations, audit log, caching strategy. |

## Reading order for a new contributor

1. Skim the historical specs at [`../specs/`](../specs/) for context.
2. Read each SKILL.md above: React Best Practices → Supabase.