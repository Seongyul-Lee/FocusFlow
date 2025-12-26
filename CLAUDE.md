# pomobox - Claude Code Project Intelligence (SSOT)

이 문서는 pomobox 레포에서 Claude Code가 따라야 하는 운영 규칙의 SSOT다.
규칙 충돌 시, 이 문서가 최우선이다.

> 상세 가이드: `docs/workflow-detail.md` 참조

---

## 0) 프로젝트 개요
- 제품: pomobox (Pomodoro timer + 통계/설정)
- 목표: 정확한 타이머 상태/통계 정책의 일관성 유지
- 원칙: 최소 변경 + 근거 기반 + 롤백 가능성 유지
- 스택 확인: `pnpm -s run`

---

## 1) 워크플로우 (필수 단계)

**모든 코드 작업**은 반드시 다음 순서:

| 단계 | 명령 | 비고 |
|------|------|------|
| 1. 작업 시작 | `task-master next` 또는 사용자 요청 | |
| 2. Plan | `/plan` | **필수** - 코드 변경 시 예외 없음 |
| 3. Docs | `/docs` | **필수** - Hook이 강제함 |
| 4. 구현 | 코드 작성 | `pnpm lint && pnpm build` |
| 5. 상태 | `task-master set-status <id> done` | **필수** - 커밋 전 완료 |

**"다음 단계/next/계속" 요청** → 반드시 `task-master next` 먼저 실행

---

## 2) Quality Gates
- 작업 종료 전: `pnpm lint`, `pnpm build` (리스크 높으면 `pnpm e2e`)
- 커밋 메시지: 한국어
- UI 변경: 접근성 확인 (키보드/ARIA/대비)

---

## 3) Safety (절대 규칙)
- `.env`/비밀키/토큰: 읽거나 출력 금지
- 파괴적 명령: 실행 전 변경 범위 + 롤백 제시 필수
- 대규모 리팩터링: 임의 제안 금지

---

## 4) Tooling SSOT

### 4.1 Task Master
- SSOT: `.taskmaster/`
- Provider: `claude-code` (키/토큰 레포 저장 금지)
- 조회: `status="pending,in-progress"` 필터 필수 (전체 조회 금지)

### 4.2 Context7
- 할당량: 200/day 적극 활용
- 캐시: `docs/context7-baseline.json` (당일 캐시 재사용)
- 자동 조회: 파일 타입별 라이브러리 문서 조회

### 4.3 Hook 강제
- 파일: `.claude/hooks/enforce-docs.js`
- 동작: Edit/Write 시 오늘 baseline 항목 확인 → 없으면 차단
- 면제: `docs/`, `.claude/`, `.taskmaster/`, `*.md`, `*.json`

---

## 5) 언어 규칙
- 모든 출력: 한국어
- 영어 UI 표시 시: 선택지 한국어 설명 + 권장/대안 제시

---

## 6) Scripts
- 패키지 매니저: pnpm
- 기본 게이트: `pnpm lint` → `pnpm build`
- E2E: `pnpm e2e` (리스크 높은 변경 시)
- 확인: `pnpm -s run`

---

## 7) Code Style
- React 함수형 컴포넌트 + Hooks (클래스 금지)
- any/unknown 남용 금지
- 상태: SSOT 유지, 경쟁 조건 방지

---

## 8) Testing
- Plan 문서로 시작: `docs/plans/PLAN_<feature>.md`
- 우선순위: 회귀 방지 > 엣지 케이스 > 접근성

---

## 9) Performance
- 불필요한 리렌더 방지
- 큰 컴포넌트: 지연 로딩/메모이제이션

---

## 10) Debugging
- 재현 절차 먼저 고정
- 로그: 최소 정보만 (민감정보 금지)

---

## 11) Dependencies
- 의존성 추가 최소화 (Plan에 이유/대안 기록)
- 외부 문서: Context7 baseline 통해서만
