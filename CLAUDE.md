# pomobox - Claude Code Project Intelligence (SSOT)

이 문서는 pomobox 레포에서 Claude Code가 따라야 하는 “운영 규칙 + 품질 기준 + 도구 사용 정책”의 SSOT다.
규칙 충돌 시, 이 문서가 최우선이다.

---

## 0) 프로젝트 개요 (Project Overview)
- 제품/도메인: pomobox (Pomodoro timer + 통계/설정)
- 목표: 기능 구현보다 “정확한 타이머 상태/통계 정책”의 일관성 유지가 우선
- 작업 원칙: 최소 변경(minimal diff) + 근거 기반(파일/로그/테스트/명세) + 롤백 가능성 유지

> NOTE: 기술 스택/스크립트는 레포의 `package.json`을 기준으로 확정한다.
> (확인 방법) `pnpm -s run` 또는 `cat package.json`

---

## 1) Default workflow (우선순위 고정)
- 계획/작업쪼개기/다음 할 일 관리는 taskmaster-ai(MCP)를 우선 사용한다.
- 외부 라이브러리/프레임워크(Next.js/React 등) API가 불확실하면 context7(MCP)로 문서를 확인한 뒤 답한다.
- 로컬 코드(레포 내부 구현)는 context7로 묻지 말고, 현재 파일/변경 diff를 근거로 답한다.
- 모든 작업은 Plan에 `Workdir`를 먼저 확정한다. (plan-template 기준)
- 실행은 `cd ~/pomobox/<workdir> && claude`로 해당 폴더에서 시작한다.

---

## 2) Quality gates (finish conditions)
- 작업 종료 전: 관련된 최소 명령을 실행한다: pnpm lint, pnpm build (리스크 높은 변경은 pnpm e2e)
- 커밋 메시지는 한국어로 작성한다.
- UI 변경이 있으면 접근성(키보드 포커스/ARIA/대비) 확인을 포함한다.

### Lightweight Ops (low-maintenance)
- Commands의 권위는 항상 `package.json` scripts이며, 문서에 명령을 “고정”하지 않는다. 필요 시 `pnpm -s run`으로 확인한다.
- 기본 품질 게이트(권장): pnpm lint → pnpm build (리스크 높은 변경은 pnpm e2e).
- Plan은 Section 8 준수
- Plan에는 최소 3가지만 적는다: 변경 요약 / 영향 범위(파일) / 검증 명령(또는 체크).
- 사소한 변경(문구/스타일/주석/리드미)은 Plan 생성을 생략해도 된다.

---

## 3) Safety (절대 규칙)
- `.env` / 비밀키 / 토큰 값은 읽거나 출력하지 않는다.
- 키/토큰이 필요하면 _S@E@L@F: ..._ 플레이스홀더만 사용한다.
- 파괴적 명령(삭제/대량 변경)은 실행 전 반드시 변경 범위와 롤백을 제시한다.
- 임의로 “전체 리팩터링/대규모 폴더 이동”을 제안하지 않는다. (필요 시 단계적/가역적 계획만)

---

## 4) Tooling SSOT: Claude Code + Task Master + Context7

### 4.1 Task Master (MCP)
- Task Master는 `.taskmaster/`를 SSOT로 사용한다.
- 모델은 `claude-code` provider로 통일한다(키/토큰을 레포에 저장하지 않는다).
- `--research` 옵션은 사용하지 않는다(Research는 사실상 OFF).
- 기본 운영:
  - PRD/태스크 생성은 `.taskmaster/docs/`에서 관리
  - 태스크 실행은 “next → 구현 → quality gates → 커밋” 순서로 진행
- 상태 확인(진행/완료/우선순위)은 task-master list/show/next 등 Task Master 출력만 SSOT로 신뢰한다.
- docs/prd.txt의 체크박스는 참고용이며, 불일치 시 항상 Task Master 상태를 우선한다.

### 4.2 Context7 (Free 200/day 적극 활용) — 자동 조회 정책
- **작업 시작 시 자동으로 Context7을 조회한다** (할당량 200/day 적극 활용)
- 당일 baseline 캐시가 있으면 재사용, 없으면 자동 조회 후 캐시
- 다음 날(retrievedAt 날짜 다름)이면 자동 재조회하여 최신 문서 반영
- baseline 경로: docs/context7-baseline.json

#### 자동 조회 규칙 (파일 타입별)
작업 중인 파일에 따라 자동으로 관련 라이브러리 문서 조회:
- `app/**/*.tsx`, `app/**/*.ts` → `/vercel/next.js` (App Router, Server Actions, Metadata 등)
- `components/**/*.tsx` → React Hooks, Radix UI 컴포넌트
- `lib/**/*.ts` → 사용 중인 주요 라이브러리 (zod, date-fns 등)
- `tests/**/*.ts` → Playwright, Testing Library
- 기타: Claude 판단에 따라 필요 시 조회

#### Topic 정의(고정)
- `주제(topic) = (context7CompatibleLibraryID) + (topic) + (작업 맥락)`
- 예: `/vercel/next.js + server actions + "form validation with zod"`

#### 기록 스키마(필수 7개 필드)
- `topicName`: 고유 식별자 (예: "nextjs-server-actions-validation")
- `context7CompatibleLibraryID`: Context7 라이브러리 ID
- `topic`: 조회한 주제
- `pageRange`: 조회한 페이지 범위
- `retrievedAt`: ISO 8601 날짜 (날짜 비교용, 예: "2025-12-24T00:00:00Z")
- `keyAPIs`: 핵심 API 목록 (배열)
- `constraints`: 제약사항/주의사항 (배열)
- `appliesToFiles`: 적용 대상 파일 (배열)

#### Baseline 캐시 전략
1. **작업 시작 시**: baseline에서 topicName + retrievedAt 확인
2. **당일 캐시 존재**: 재사용 (Context7 호출 안 함)
3. **다른 날 또는 없음**: 자동 조회 후 baseline 업데이트
4. **할당량 관리**: 같은 topic은 하루 1회만 조회 (자정 지나면 자동 갱신)

#### 사용량 추정
- 예상 일일 사용량: 15-30회 (할당량의 7.5-15%)
- 파일 타입별 자동 조회로 항상 최신 문서 기반 작업
- 할당량 부족 시 당일 캐시만 사용

---

## 5) 언어 규칙 (pomobox)
- 모든 설명/요약/체크리스트/결론은 한국어로 작성한다.
- 단, Claude Code가 표시하는 권한/진행 선택 UI(예: "Do you want to proceed?")는 영어로 나타날 수 있다.
  이 경우, 반드시 다음을 함께 제공한다:
  1) 선택지 1/2/3이 의미하는 바를 한국어로 재진술
  2) 권장 선택(이유 포함) 1개 제시
  3) 보수적 대안(더 안전하지만 번거로운 선택) 1개 제시

---

## 6) Commands & Scripts (레포 기준으로만 확정)
- 패키지 매니저: pnpm
- 스크립트 목록 확정: `pnpm -s run`

### 현재 유효 스크립트(스냅샷, package.json 기준)
- 현재 `package.json`에 정의된 pnpm scripts는 아래뿐이다:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm start`
  - `pnpm lint`
  - `pnpm e2e`
  - `pnpm e2e:ui`
  - `pnpm e2e:report`
- pnpm lint, pnpm build (리스크 높은 변경은 pnpm e2e)
- 스크립트가 변경될 수 있으므로 실행 전에는 항상 `pnpm -s run`으로 재확인한다.

### E2E (Playwright) 운영 규칙
- E2E는 Playwright 기반이며 기본 경로는 `tests/e2e/`, 설정은 `playwright.config.ts`를 사용한다.
- 기본 실행: `pnpm e2e` (필요 시 `pnpm e2e:ui`, `pnpm e2e:report`)
- 리스크 높은 변경(라우팅/인증/상태관리/타이머 핵심 로직/배포 설정 등) 시 필수 게이트: 기본 게이트 + `pnpm e2e`

> NOTE: dev 서버/테스트 러너/포맷터 명령은 `package.json` 확인 후 이 섹션을 업데이트한다.

---

## 7) Code Style & Standards (안전한 기본값)
- React 함수형 컴포넌트 + Hooks 중심(클래스 컴포넌트 금지)
- 타입 안정성 우선: any/unknown 남용 금지(불가피하면 사유/범위/대안 명시)
- 상태/타이머 로직은 “단일 출처(SSOT state)”를 유지하고, 경쟁 조건(race)을 방지한다.
- 파일/모듈 경계를 흐리는 전역 유틸 난립 금지(필요 시 명확한 책임을 가진 모듈로 캡슐화)

---

## 8) Testing & Verification (Plan/Skill 기반 운영)
- 기능 작업은 “Plan 문서”로 시작한다.
  - Plan 생성 위치(권장): `docs/plans/PLAN_<feature-name>.md`
  - Plan 문서 구조/Quality Gate/리스크·롤백은 `plan-template.md` 및 `SKILL.md`의 체크리스트를 따른다.
- 테스트 우선순위:
  1) 회귀 방지(통계/타이머 정책) 우선
  2) 엣지 케이스(연타/경계시간/새로고침 복구 등)
  3) UI 접근성(키보드/포커스)

---

## 9) Performance Guidelines (기본 원칙)
- 불필요한 리렌더/타이머 틱 기반 상태 폭증 방지
- 이벤트 핸들러/타이머 콜백은 최신 상태를 안전하게 참조하도록 설계
- 번들/렌더 비용이 큰 컴포넌트는 지연 로딩/메모이제이션 검토

---

## 10) Debugging & Development
- 문제 재현 절차를 먼저 고정(재현 단계/기대 결과/실제 결과)
- 로그는 원인 규명에 필요한 최소 정보만(민감정보/토큰/쿠키 출력 금지)
- “원인 가설 → 검증(테스트/로그) → 결론” 순서로 문서화

---

## 11) External Dependencies / Docs
- 의존성 추가는 최소화(추가 이유/대안/영향을 Plan에 기록)
- 외부 문서 확인은 Context7 baseline을 통해서만(재호출 금지 규칙 준수)
- 변경 후 문서 업데이트:
  - Plan 문서(결정/리스크/롤백)
  - baseline(새 topic인 경우만)
  - 필요하면 README/내부 가이드

---
