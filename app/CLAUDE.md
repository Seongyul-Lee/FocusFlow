# Scope: app/ (Next.js App Router)

## Applies to
- This file governs work inside `app/**` only.
- Global SSOT remains `../CLAUDE.md` (security, quality gates, Task Master/Context7 rules).

## Focus
- Routing, layouts, page structure, server/client boundaries, metadata, loading/error UI.

## Guardrails
- Do not modify timer/statistics logic here unless explicitly required; those live in `../lib/**`.
- If a change spans multiple folders, stop and create a short plan first (what changes where, and which gates to run).

## Default gates for app changes
- `pnpm lint`
- `pnpm build`
- High-risk changes: add `pnpm e2e`
