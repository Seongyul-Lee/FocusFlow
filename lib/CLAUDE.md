# Scope: lib/ (Core logic: timer/stats/storage)

## Applies to
- This file governs work inside `lib/**` only.
- Global SSOT remains `../CLAUDE.md`.

## Focus
- Timer state machine correctness, stats policy, persistence (localStorage), edge cases (skip/reset/pause).

## Guardrails (non-negotiable)
- Maintain a single source of truth for timer state.
- Avoid race conditions: no competing intervals/timers; prefer explicit state transitions.
- Any logic change must include a brief reasoning note in the PR/plan.

## Gates
- Always: `pnpm lint` + `pnpm build`
- Logic changes (timer/stats/storage): also run `pnpm e2e`
