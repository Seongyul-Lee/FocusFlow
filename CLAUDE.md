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

---

## 2) Quality gates (finish conditions)
- 작업 종료 전: 관련된 최소 명령을 실행한다: `pnpm lint`, `pnpm build` (테스트가 있으면 `pnpm test`)
- 커밋 메시지는 한국어로 작성한다.
- UI 변경이 있으면 접근성(키보드 포커스/ARIA/대비) 확인을 포함한다.

### Lightweight Ops (low-maintenance)
- Commands의 권위는 항상 `package.json` scripts이며, 문서에 명령을 “고정”하지 않는다. 필요 시 `pnpm -s run`으로 확인한다.
- 기본 품질 게이트(권장): `pnpm lint` → `pnpm build` → (가능하면) `pnpm test` (실제 존재 여부는 scripts 기준).
- 리스크 높은 변경(타이머 상태/통계/저장·복구/UI 플로우)은 구현 전에 `docs/plans/PLAN_<slug>.md`를 “초간단(3~7줄)”로 생성하는 것을 권장한다.
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

### 4.2 Context7 (Free 200/day 최적화) — 강제 규칙
- “코드 작성/수정/리뷰 시작 시” topic별 Context7 1회만 조회한다.
- 동일 topic 재호출 금지. 첫 조회 결과는 반드시 baseline에 기록하고 작업 내내 재사용한다.
- baseline 경로: `pomobox/docs/context7-baseline.json`

#### Topic 정의(고정)
- `주제(topic) = (context7CompatibleLibraryID) + (topic) + (결정 지점/변경셋)`
- 예: `/vercel/next.js + app router metadata + "layout/page에서 metadata 설계 결론"`

#### 기록 스키마(필수 7개 필드)
- `topicName`
- `context7CompatibleLibraryID`
- `topic`
- `pageRange`
- `retrievedAt`
- `keyAPIs/constraints`
- `appliesToFiles`

#### 예외(재호출 허용) — 반드시 사유 기록
1) 새 topic
2) 기존 baseline 불충분(범위 확장; pageRange 내 확장 + 사유 기록)
3) 버전/에러 재검증(사유 기록)

#### .claude/commands/docs.md 준수
- docs 실행 시 항상 baseline에서 `topicName`으로 먼저 검색한다.
- 존재하면 Context7 호출 금지, baseline 재사용
- 없으면 1회 호출 후 baseline에 기록(스키마 준수)

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
- 패키지 매니저: pnpm (품질 게이트 명령에 pnpm 사용)
- 스크립트 목록 확정: `pnpm -s run`
- 기본 품질 게이트:
  - `pnpm lint`
  - `pnpm build`
  - (있다면) `pnpm test`

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
