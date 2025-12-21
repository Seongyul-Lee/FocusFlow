# AGENTS.md — pomobox Agent Operating Rules

This file defines non-negotiable rules for AI coding agents (e.g., Codex) working in this repository.

## 1 Source of Truth (SSOT)

- **Read `HUB.md` first.** Treat it as the single source of truth for:
  - current status, decisions/policies, priorities (P0/P1/P2), and release gates.
- **Do not invent facts.** If `HUB.md` is missing required information, ask only the minimum questions needed to proceed.
- **Conflict rule:** If chat/instructions conflict with `HUB.md`, treat `HUB.md` as authoritative and request a `HUB.md` update rather than overriding it.

## 2 Scope: Exactly One Unit of Work

You must do **exactly one** of the following per PR:

- **PATCH:** Fix **exactly one bug** with **minimal diff**.
- **BUILD:** Implement **exactly one feature** (no bug hunting).

Hard limits:
- No unrelated refactors.
- No formatting churn.
- No drive-by fixes.

If you discover additional issues, **stop** and report them as notes (do not fix them).

## 3 Branching / Promotion Rules

- **Never push/merge to `main`.**
- Work on:
  - `preview`, or
  - a feature branch targeting `preview` via PR.
- PR base must be **`preview`**.
- Promotion `preview → main` is gated by QA; do not attempt it.

## 4 Tech Constraints (pomobox)

- Framework: **Next.js (App Router)** + **TypeScript**
- State management: **React Hooks only** (`useState`, `useEffect`). No external state libs.
- Styling: **Tailwind only**. Prefer **shadcn/ui**. No separate CSS files.
- Storage: **localStorage first**, but **SSR-safe** (guard `window`, client-only reads).
- Dependencies: **Do not add new libraries** unless explicitly required by `HUB.md` decision log.
- UI copy: **English** (short, clear).

## 5 Timer / Pomodoro Correctness (when relevant)

If the task touches timer logic or stats, you must preserve:

- No duplicate intervals; strict start/pause/reset/skip boundaries.
- Background/inactive-tab drift handling via **timestamp-based remaining time**.
- Deterministic phase transitions (focus ↔ break ↔ long break).
- Stats increment rules must follow the **policy recorded in `HUB.md`**.
  - If policy is missing/unclear, **do not guess**—ask for a `HUB.md` decision first.

## 6 Lockfile / Package Manager Discipline

- Use the existing package manager already implied by the repo (do not switch tools).
- **Do not modify `package.json` / lockfiles** unless the task explicitly requires it.
- Avoid whitespace-only or EOL-only changes in JSON files.

## 7 Required Deliverables (Agent Output)

Your final response must include:

1) **Summary** (≤ 5 lines)
2) **What changed and why** (brief, evidence-based)
3) **Files changed** (list)
4) **Diff/patch** (or exact file contents if requested by the operator)
5) **Commands to run** (copy-paste-ready)
6) **Verification steps** (5–10 steps) + clear PASS criteria
7) **Risks / Notes** (only if necessary)

## 8 PR Requirements

PR must target `preview` and include:

- Commit SHA(s)
- If applicable, the **immutable Vercel preview deploy URL** used for verification
- A concise checklist:
  - [ ] Scope is exactly one PATCH/BUILD
  - [ ] Minimal diff (no unrelated changes)
  - [ ] Verified locally
  - [ ] `HUB.md` Snapshot updated (see below)

Git commit message:
- **Korean, one line, concise.**

## 9 HUB.md Update Requirement (Mandatory)

Every PR must update `HUB.md` Snapshot:

- Bump `Revision` by +1
- Update `Last updated (KST)`
- Update only the necessary sections:
  - `## Current` (commit/deploy pointers if changed)
  - `## Done (last 3)` (add the completed item)
  - `## Now (exactly 1)` (keep exactly 1)
  - `## Blockers/Risks (P0 only)` (update/remove if resolved)
  - `## Decision log (last 3)` (only if a decision changed)
  - `## Gate (Release/Exit)`:
    - **Do not declare QA PASS** unless there is a QA record + immutable deploy evidence.
    - If QA is required but not done, keep status as **IN-PROGRESS** or **BLOCK** per HUB policy.

## 10 Safety

- Never request or store secrets/tokens.
- Use placeholders when needed:
  - `OPENAI_API_KEY=_S@E@L@F: OpenAI API key_`

## 11 Stop Conditions (Ask Minimal Questions)

Stop and ask for clarification if any of the following is true:

- `HUB.md` is missing required policy for timer/stats behavior.
- The request would require changing more than one bug/feature.
- You cannot verify the change with a clear PASS criterion.
- The task would require pushing/merging to `main`.
