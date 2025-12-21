# HUB (SSOT)

## Snapshot
Revision: 7
Last updated (KST): 2025-12-21 23:56

## Current
- State: Traceability(Preview baseline + immutable deploy) 고정 완료. P0 잔여(Reset/Skip 정합) 오픈. (Repo: Seongyul-Lee/pomobox / Prod: https://pomobox.app)
- Branch/Commit: preview @ 83c8c61
- Preview baseline (commit): 83c8c61
- Preview deploy (immutable): pomobox-3ow8b9boq-tjddbfzsd66-9025s-projects.vercel.app
- QA status: IN-PROGRESS — Background drift scenario PASS (2025-12-19, recorded in chat(6), evidence anchored to the immutable deploy above)


## Done (last 3)
- P0: RUNNING 중 duration 저장 차단(A안) 적용 (Settings Save/버튼 비활성)
- Ops: SSOT(HUB)·AGENTS 규칙 레포 반영 (preview)
- QA: Background drift scenario PASS 기록 유지 (chat(6) / 2025-12-19)

## Now (exactly 1)
- P0 잔여 해결 준비: Reset/Skip 정합(정의-구현-UI) 이슈 Patch Room(#3) 티켓으로 분리/위임

## Blockers/Risks (P0 only)
- P0: Reset/Skip 정합(정의-구현-UI) — 통계/phase 전환 규칙 단일화 필요

## Decision log (last 3)
- [2025-12-21] Decision: Timer running 중 duration 변경은 Save 비활성으로 차단.
- [2025-12-21] Decision: Traceability locked (preview baseline=0dff7fe, deploy=immutable URL).
- [2025-12-19] Decision: 문서 정합으로 README 프로젝트명 pomobox로 정리 (commit: 0dff7fe).

## Next candidates (top 3)
- P0 잔여 해결: running 중 duration 변경 시 진행/통계 불일치, Reset/Skip 정합(정의-구현-UI) → Patch Room(#3) 티켓화 및 처리
- QA 게이트 정리: 회귀 테스트 시나리오를 Preview(immutable)에서 실행/기록(체크리스트/링크 포함) (anchor: immutable deploy URL)
- 승격 준비: QA PASS 증빙 정리 후 PR로 preview → main merge (Gate 충족 후)

## Gate (Release/Exit)
- Promote rule: P0 해결 + QA PASS 기록(immutable Preview deploy + preview baseline commit 고정) 완료
- Gate-P0-A: In Settings, while the timer is RUNNING, duration controls and Save must be disabled, the helper text “Stop the timer to change durations.” must be shown, and no duration value or countdown may change; once not RUNNING (paused/stopped), controls and Save must re-enable and saving must update idle durations.
- Current gate decision: BLOCK (QA: IN-PROGRESS; P0 open)