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

## 1) Default workflow (하이브리드 운영)

### 워크플로우 개요
Task Master는 **작업 추적의 SSOT**이며, 작업 선택은 **유연하게** 진행한다.

### 필수 단계 (모든 워크플로우 공통)
1. **작업 시작**: 사용자 요청 또는 `task-master next`
2. **/plan**: 구현 계획 수립 (자동 또는 명시적)
3. **/docs**: 외부 문서 조회 ⚠️ **필수** - /plan 이후 반드시 실행
   - baseline에 캐시된 문서는 재조회 안 함 (200/day 초과 방지)
   - 새 topic이거나 캐시 없는 경우만 Context7 호출
4. **구현**: 코드 작성 + 품질 게이트 (lint/build/e2e)
5. **상태 업데이트**: `task-master set-status` ⚠️ **필수**

### 워크플로우 A: Task Master 중심 (계획된 작업)
```bash
# 1. 다음 작업 조회
task-master next

# 2. Plan 수립
/plan

# 3. 문서 조회 (필수)
/docs <관련 라이브러리/프레임워크>

# 4. 구현 + 품질 게이트
구현...
pnpm lint && pnpm build

# 5. 상태 업데이트 (필수)
task-master set-status <id> done
```

**사용 시기**: PRD 기반 Phase/Milestone, 의존성 있는 작업

### 워크플로우 B: 사용자 중심 (즉흥적 작업)
```bash
# 1. 사용자 요청
"다크모드 추가해줘"

# 2. Plan 수립
/plan (자동 실행)

# 3. 문서 조회 (필수)
/docs <관련 라이브러리/프레임워크>

# 4. 구현 + 품질 게이트
구현...
pnpm lint && pnpm build

# 5. Task 생성 + 상태 업데이트 (필수)
task-master에 추가 후 done 처리
```

**사용 시기**: 버그 수정, 긴급 요청, 실험적 기능

### 상태 업데이트 규칙 (절대 규칙)
- ✅ **모든 작업 완료 시 task-master set-status 필수**
- ✅ 워크플로우 A: 기존 task 상태 업데이트
- ✅ 워크플로우 B: 새 task 추가 후 done 처리
- ✅ 커밋 전 반드시 상태 업데이트 완료
- ❌ 상태 미업데이트 커밋 금지

### 사용자 요청 패턴별 강제 규칙 (절대 규칙)

#### "다음 단계" 요청 시 → task-master next 필수
사용자가 다음 중 하나의 패턴으로 요청하면 **반드시 task-master next**를 먼저 실행:

**강제 트리거 패턴:**
- "다음 단계"
- "다음 작업"
- "next"
- "다음"
- "계속"

**실행 순서:**
```bash
# 1. 자동으로 task-master next 실행 (필수)
task-master next

# 2. 반환된 task로 워크플로우 A 진행
/plan
/docs
구현...
task-master set-status <id> done
```

**금지:**
- ❌ "다음 단계" 요청 시 task-master next 없이 진행
- ❌ 사용자에게 "다음 할 일이 뭐죠?" 같은 질문 (Task Master가 SSOT)

### 세션 재시작 시 컨텍스트 복구
새 터미널에서 `claude` 실행 시 다음 순서로 진행 상황 확인:

1. **Task Master 조회**
   ```bash
   task-master get-tasks status="in-progress,pending"
   ```

2. **최근 커밋 확인**
   ```bash
   git log -5 --oneline
   ```

3. **작업 중인 브랜치 확인**
   ```bash
   git status
   git branch
   ```

4. **컨텍스트 복구 완료**
   - Task Master 상태가 SSOT
   - in-progress task가 현재 작업
   - pending task가 다음 작업

### 기타 원칙
- 외부 라이브러리/프레임워크(Next.js/React 등) API가 불확실하면 context7(MCP)로 문서를 확인한 뒤 답한다.
- 로컬 코드(레포 내부 구현)는 context7로 묻지 말고, 현재 파일/변경 diff를 근거로 답한다.
- 모든 작업은 Plan에 `Workdir`를 먼저 확정한다. (plan-template 기준)

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

### 4.1 Task Master (MCP) - 작업 추적의 SSOT
- Task Master는 `.taskmaster/`를 SSOT로 사용한다.
- 모델은 `claude-code` provider로 통일한다(키/토큰을 레포에 저장하지 않는다).
- `--research` 옵션은 사용하지 않는다(Research는 사실상 OFF).

#### 기본 운영 원칙
- PRD/태스크 생성은 `.taskmaster/docs/`에서 관리
- 태스크 실행은 "작업 시작 → /plan → /docs → 구현 → quality gates → **set-status (필수)** → 커밋" 순서로 진행
- 상태 확인(진행/완료/우선순위)은 task-master list/show/next 등 Task Master 출력만 SSOT로 신뢰한다.
- docs/prd.txt의 체크박스는 참고용이며, 불일치 시 항상 Task Master 상태를 우선한다.

#### 상태 업데이트 필수 정책 (절대 규칙)
⚠️ **모든 작업 완료 시 task-master set-status 필수**

**워크플로우별 처리:**
1. **워크플로우 A (Task Master 중심)**
   ```bash
   # 기존 task 상태 업데이트
   task-master set-status <id> done
   ```

2. **워크플로우 B (사용자 중심)**
   ```bash
   # Step 1: tasks.json에 새 task 추가 (간결한 템플릿)
   # Step 2: 상태를 done으로 설정
   task-master set-status <new-id> done
   ```

**이유:**
- 세션 재시작 시 컨텍스트 복구 필수
- 진행 상황 추적 (어느 작업까지 완료했는지)
- 팀원/미래의 자신이 작업 이력 파악

**금지:**
- ❌ 상태 미업데이트 후 커밋
- ❌ Task Master 없이 작업 완료
- ❌ "나중에 업데이트" (반드시 즉시)

#### 세션 재시작 시 컨텍스트 복구 (자동 실행)
새 터미널에서 `claude` 실행 시, **자동으로** 다음 순서로 컨텍스트 복구:

**Step 1: Task Master 상태 확인 (필수)**
```bash
# 현재 작업 중/대기 중인 task 조회
task-master get-tasks status="in-progress,pending"
```
- `in-progress`: 현재 작업 중 (재개 대상)
- `pending`: 다음 작업 대기

**Step 2: Git 상태 확인**
```bash
# 최근 커밋 5개 확인
git log -5 --oneline

# 현재 브랜치 및 변경 사항
git status
```

**Step 3: 컨텍스트 복구 완료**
- Task Master 상태 = SSOT (가장 신뢰)
- in-progress task가 있으면 해당 작업 재개
- 없으면 `task-master next` 또는 사용자 요청 대기

**예시:**
```
# 새 터미널 시작
$ claude

# Claude Code 자동 실행:
> task-master get-tasks status="in-progress"
  → Task 12 (in-progress): "다크모드 구현"

> git log -3 --oneline
  → 63551a5 Task Master 최적화
  → e1e3f41 Phase 3 완료

> git status
  → On branch preview
  → Changes: components/theme-provider.tsx (modified)

# 복구 완료 메시지:
✓ 작업 복구: Task 12 "다크모드 구현" 진행 중
✓ 파일 수정: components/theme-provider.tsx
✓ 다음 단계: 구현 완료 → set-status → 커밋
```

#### Task Master 크기 제한 규칙 (토큰 초과 방지)
**문제**: tasks.json 파일이 커지면 MCP 응답이 25,000 토큰 제한 초과
**해결**: 파일 크기 관리 + 조회 최적화

**Task/Subtask 생성 규칙**:
- `details`: 3줄 이내로 간결하게 (상세 내용은 `.taskmaster/docs/` 문서로 분리)
- `description`: 1-2문장 요약만
- `testStrategy`: 검증 방법 1줄
- `expansionPrompt`: 생략 (불필요)
- Subtask 개수: 최대 5개 (필요시 task 분리)

**Task 조회 규칙**:
- `get_tasks`는 **반드시 status 필터 사용**
  - 예: `status="pending,in-progress"` (전체 조회 금지)
- 특정 task만 조회: `get_task(id="11")`

**아카이브 정책**:
- Phase/Milestone 완료 시 완료된 task를 `archived-tasks.json`으로 이동
- 아카이브 스크립트: `.taskmaster/scripts/archive-tasks.sh`
- tasks.json은 현재 작업 중인 task만 유지 (최대 10-15개 권장)

**Task 추가 방법**:
- Task Master MCP에는 task 추가 함수 없음
- 방법 1: `tasks.json` 직접 편집 (간결한 템플릿 사용)
- 방법 2: PRD 업데이트 후 `parse_prd` 재실행

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
