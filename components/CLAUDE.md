# Scope: components/ (UI components)

## Applies to
- This file governs work inside `components/**` and `components/ui/**` only.
- Global SSOT remains `../CLAUDE.md`.

## Focus
- Presentational components, accessibility (ARIA, focus), consistent styling.

## Guardrails
- Avoid embedding business logic in components; keep logic in `../lib/**` or hooks.
- For UI changes that impact flows (routing/auth/settings), coordinate with `../app/**`.

## Gates
- `pnpm lint`
- `pnpm build`
