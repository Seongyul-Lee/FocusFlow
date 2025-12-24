# Pomobox 타이머 상태 관리 구조 분석

**작성일**: 2025-12-24
**목적**: 현재 타이머 상태/통계/저장 구조를 분석하고, Pause 기능 추가를 위한 설계 기초 확보
**관련 Task**: Task #1 - 현재 Pomobox 타이머 상태 관리 구조 분석 및 문서화

---

## 1. 현재 코드 구조 (As-Is)

### 1.1 파일 구성
| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `components/pomodoro-timer.tsx` | 332 | 메인 타이머 로직, 상태 관리, UI |
| `components/settings-dialog.tsx` | 218 | 설정 다이얼로그 UI |
| `lib/storage.ts` | 17 | localStorage wrapper (간단) |

### 1.2 현재 상태 관리 구조

#### 상태 변수 (pomodoro-timer.tsx:21-29)
```typescript
const [type, setType] = useState<TimerType>('focus')  // 'focus' | 'break' | 'longBreak'
const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
const [isRunning, setIsRunning] = useState(false)
const [sessions, setSessions] = useState(0)  // 완료된 Focus 세션 수 (통계)
const [completedSessions, setCompletedSessions] = useState(0)  // 종료된 Focus 수 (롱브레이크 트리거용)
const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)  // 누적 포커스 시간
const [targetEndAtMs, setTargetEndAtMs] = useState<number | null>(null)  // Wall-clock 기반 종료 시각
```

**특징**:
- `type`과 `isRunning`의 **조합으로 상태를 표현** (명시적 상태머신 없음)
- `isRunning`이 `false`이면 "정지" 또는 "일시정지"를 구분 불가
- Pause는 단순히 `isRunning` 토글로 처리 → **Pause 상태가 명시적이지 않음**

---

## 2. 현재 상태 머신 (Implicit State Machine)

### 2.1 상태 정의 (현재)
실제 상태는 `(type, isRunning)` 조합:
- `('focus', true)` → Focus 실행 중
- `('focus', false)` → Focus 정지 (초기 또는 Pause)
- `('break', true)` → Break 실행 중
- `('break', false)` → Break 정지
- `('longBreak', true)` → Long Break 실행 중
- `('longBreak', false)` → Long Break 정지

**문제점**:
- "정지"와 "일시정지(Pause)"를 구분할 수 없음
- 새로고침 시 `isRunning`이 저장되지 않아 복구 불가

### 2.2 상태 전환 규칙 (현재)

```
[Focus 완료 (00:00)]
├─ completedSessions % 4 === 0 → Long Break
└─ else → Short Break

[Break/Long Break 완료 (00:00)]
└─ Focus

[Skip - Focus]
├─ completedSessions += 1
├─ completedSessions % 4 === 0 → Long Break
└─ else → Short Break

[Skip - Break/Long Break]
└─ Focus

[Reset]
└─ Focus (정지 상태)
```

### 2.3 타이머 로직 (Wall-Clock 기반)

**핵심 메커니즘** (pomodoro-timer.tsx:96-127):
1. `isRunning`이 `true`가 되면 `targetEndAtMs = Date.now() + timeLeft * 1000` 설정
2. 1초마다 `remainingSeconds = Math.max(0, Math.ceil((targetEndAtMs - Date.now()) / 1000))` 재계산
3. `visibilitychange` 이벤트로 탭 복귀 시 즉시 재계산 → **백그라운드 drift 방지**

**장점**:
- 백그라운드에서도 정확한 시간 추적
- 시스템 시계 기반으로 브라우저 타이머 부정확성 회피

**단점**:
- `targetEndAtMs`가 localStorage에 저장되지 않아 **새로고침 시 복구 불가**

---

## 3. 통계 계산 로직 (Statistics Policy)

### 3.1 통계 변수 정의
| 변수 | 의미 | 증가 조건 | localStorage 키 |
|------|------|-----------|-----------------|
| `sessions` | 오늘 완료된 Focus 세션 수 | Focus 00:00 도달 시만 | `pomodoro-sessions` |
| `completedSessions` | 종료된 Focus 수 (롱브레이크 트리거용) | Focus 완료 또는 Skip 시 | (저장 안 됨) |
| `totalFocusMinutes` | 오늘 누적 포커스 시간 (분) | Focus 00:00 도달 시만 | `pomodoro-total-minutes` |

### 3.2 통계 업데이트 규칙

#### Focus 완료 (00:00 도달, pomodoro-timer.tsx:153-161)
```typescript
if (type === 'focus') {
  const newCompleted = completedSessions + 1
  setCompletedSessions(newCompleted)
  setSessions((prev) => prev + 1)  // sessions += 1

  const newTotal = totalFocusMinutes + settings.focusDuration
  setTotalFocusMinutes(newTotal)  // totalFocusMinutes += focusDuration

  // Long Break 또는 Short Break로 전환
}
```

#### Focus Skip (pomodoro-timer.tsx:216-234)
```typescript
const handleSkip = () => {
  if (type === 'focus') {
    const newCompleted = completedSessions + 1
    setCompletedSessions(newCompleted)  // completedSessions만 증가
    // sessions, totalFocusMinutes는 증가 안 함 (중요!)
  }
}
```

**통계 불변 규칙**:
- **Pause/Resume**: 통계 변화 없음 (현재 구현에서는 자연스럽게 보장됨)
- **Skip (Focus)**: `completedSessions`만 증가, `sessions`/`totalFocusMinutes`는 불변
- **Skip (Break/Long Break)**: 통계 변화 없음
- **Reset**: 통계 변화 없음

### 3.3 일일 통계 리셋 (pomodoro-timer.tsx:62-76)
```typescript
const savedDate = localStorage.getItem("pomodoro-date")
const today = new Date().toDateString()

if (savedDate === today) {
  // 기존 통계 로드
} else {
  // 날짜가 바뀌면 리셋
  localStorage.setItem("pomodoro-date", today)
  localStorage.setItem("pomodoro-sessions", "0")
  localStorage.setItem("pomodoro-total-minutes", "0")
}
```

**리셋 시점**: 앱 마운트 시 날짜 비교 (자정에 실시간 리셋은 아님)

---

## 4. 저장소 정책 (localStorage)

### 4.1 현재 저장 키
| 키 | 타입 | 저장 내용 | 저장 시점 |
|----|------|-----------|----------|
| `pomodoro-settings` | JSON(string) | `{focusDuration, breakDuration, notificationsEnabled, soundEnabled, volume}` | 설정 변경 시 |
| `pomodoro-date` | string | 날짜 (예: "Tue Dec 24 2025") | 앱 마운트 시 또는 날짜 변경 시 |
| `pomodoro-sessions` | string(number) | 오늘 완료된 Focus 세션 수 | `sessions` 변경 시 (useEffect) |
| `pomodoro-total-minutes` | string(number) | 오늘 누적 포커스 시간 (분) | `totalFocusMinutes` 변경 시 (useEffect) |

### 4.2 저장되지 않는 상태 (문제점)
- ❌ `type` (focus/break/longBreak)
- ❌ `timeLeft` (남은 시간)
- ❌ `isRunning` (실행/정지 상태)
- ❌ `targetEndAtMs` (종료 목표 시각)
- ❌ `completedSessions` (롱브레이크 트리거 계산용)

**결과**:
- 새로고침 시 타이머 상태가 **완전히 초기화**됨 (Focus 정지 상태로 복귀)
- 진행 중이던 세션 손실
- 롱브레이크 주기 계산도 리셋됨

---

## 5. Skip/Reset 동작

### 5.1 Skip (pomodoro-timer.tsx:216-234)
```typescript
const handleSkip = () => {
  setIsRunning(false)
  setTargetEndAtMs(null)

  if (type === 'focus') {
    const newCompleted = completedSessions + 1
    setCompletedSessions(newCompleted)

    // Long Break 또는 Short Break로 전환
    if (newCompleted % 4 === 0) {
      setType('longBreak')
      setTimeLeft(15 * 60)
    } else {
      setType('break')
      setTimeLeft(settings.breakDuration * 60)
    }
  } else {
    // Break/Long Break Skip → Focus
    setType('focus')
    setTimeLeft(settings.focusDuration * 60)
  }
}
```

**특징**:
- Focus Skip: `completedSessions` 증가, 통계 불변
- Break/Long Break Skip: 통계 불변, Focus로 전환
- **롱브레이크 트리거는 유지됨** (4, 8, 12...)

### 5.2 Reset (pomodoro-timer.tsx:181-186)
```typescript
const handleReset = () => {
  setIsRunning(false)
  setTargetEndAtMs(null)
  setType('focus')
  setTimeLeft(settings.focusDuration * 60)
}
```

**특징**:
- 통계 불변
- **`completedSessions`는 리셋 안 됨** → 롱브레이크 주기는 유지

---

## 6. Pause 기능 추가를 위한 설계 (To-Be)

### 6.1 PRD 요구사항 (핵심)

#### 상태머신 명시화 (PRD Section 6)
```
States:
- FOCUS_RUNNING
- FOCUS_PAUSED
- BREAK_RUNNING
- BREAK_PAUSED
- LONGBREAK_RUNNING
- LONGBREAK_PAUSED

Events:
- START, PAUSE, RESUME, TICK, TIME_UP, SKIP, RESET, REHYDRATE
```

#### 통계 불변 규칙 (PRD Section 3)
- **Pause/Resume**: 통계 변화 없음
- **Skip (Focus)**: `completedSessions`만 증가, `sessions`/`totalFocusMinutes` 불변
- **Reset**: 통계 완전 불변

#### 00:00 경계 경합 (PRD Section 6)
- **MUST**: TIME_UP 시 전이/집계는 **단 1회만** 발생
- 연타/경합 방지 메커니즘 필요

#### 새로고침 복구 (PRD Section 7)
- **저장**: `phase`, `status` (idle/running/paused), `remainingSeconds`, `targetEndAtMs`, `completedSessions`
- **복구**:
  - `paused` 상태 → 그대로 복구
  - `running` 상태 → `targetEndAtMs` 기반으로 `remainingSeconds` 재계산
  - `targetEndAtMs` 경과 시 → TIME_UP 처리 (단 1회)

### 6.2 상태 구조 변경 제안

#### Before (현재)
```typescript
type: 'focus' | 'break' | 'longBreak'
isRunning: boolean
```

#### After (제안)
```typescript
phase: 'focus' | 'break' | 'longBreak'
status: 'idle' | 'running' | 'paused'
```

**장점**:
- Pause 상태 명시적 표현
- 새로고침 복구 가능
- 상태머신 전이 규칙 명확화

### 6.3 localStorage 스키마 확장

#### 신규 키: `pomodoro-timer-state`
```typescript
{
  version: 1,
  phase: "focus" | "break" | "longBreak",
  status: "idle" | "running" | "paused",
  remainingSeconds: number,
  targetEndAtMs: number | null,
  completedSessions: number,
  longBreakCount: number,  // 신규: 롱브레이크 횟수 (테스트/정합성)
  lastUpdatedAtMs: number
}
```

#### 신규 키: `pomodoro-completed-sessions`
- `completedSessions` 영속화 (롱브레이크 계산 복구용)

#### 신규 키: `pomodoro-long-break-count`
- `longBreakCount` 영속화 (통계 정합성 검증용)

### 6.4 상태 전환 다이어그램 (Pause 포함)

```
[FOCUS_RUNNING]
├─ PAUSE → FOCUS_PAUSED
├─ TIME_UP → (완료 처리: sessions++, totalFocusMinutes+=, completedSessions++)
│   ├─ completedSessions % 4 === 0 → LONGBREAK_RUNNING
│   └─ else → BREAK_RUNNING
├─ SKIP → (completedSessions++만)
│   ├─ completedSessions % 4 === 0 → LONGBREAK_RUNNING
│   └─ else → BREAK_RUNNING
└─ RESET → FOCUS_IDLE

[FOCUS_PAUSED]
├─ RESUME → FOCUS_RUNNING
├─ SKIP → FOCUS_RUNNING의 SKIP 규칙과 동일
└─ RESET → FOCUS_IDLE

[BREAK_RUNNING]
├─ PAUSE → BREAK_PAUSED
├─ TIME_UP → FOCUS_RUNNING (또는 FOCUS_IDLE)
├─ SKIP → FOCUS_RUNNING
└─ RESET → FOCUS_IDLE

[BREAK_PAUSED]
├─ RESUME → BREAK_RUNNING
├─ SKIP → BREAK_RUNNING의 SKIP 규칙과 동일
└─ RESET → FOCUS_IDLE

[LONGBREAK_RUNNING / LONGBREAK_PAUSED]
└─ BREAK와 동일 패턴
```

### 6.5 00:00 경계 경합 방지 전략

#### 문제 시나리오
```
타이머 00:01 → 사용자 SKIP 클릭 → 동시에 TIME_UP 발생
→ 두 이벤트 모두 completedSessions++ 실행 가능 → 중복 집계
```

#### 해결 방안 (3가지 중 택1)
1. **플래그 기반 락**
   ```typescript
   const [isTransitioning, setIsTransitioning] = useState(false)

   if (timeLeft === 0 && isRunning && !isTransitioning) {
     setIsTransitioning(true)
     // 전이 처리
     setIsTransitioning(false)
   }
   ```

2. **UI 비활성화**
   ```typescript
   <Button disabled={timeLeft <= 1 && isRunning} onClick={handleSkip}>
   ```

3. **이벤트 큐 순서 고정**
   - React 18+ startTransition 활용
   - useEffect 의존성 배열로 실행 순서 보장

**권장**: 플래그 기반 락 (가장 명시적이고 안전)

### 6.6 새로고침 복구 로직 (REHYDRATE)

```typescript
const rehydrateTimerState = () => {
  const saved = localStorage.getItem("pomodoro-timer-state")
  if (!saved) return null

  const state = JSON.parse(saved)
  const now = Date.now()

  if (state.status === 'running' && state.targetEndAtMs) {
    const remainingSeconds = Math.max(0, Math.ceil((state.targetEndAtMs - now) / 1000))

    if (remainingSeconds <= 0) {
      // TIME_UP 처리 (단 1회)
      return performTimeUp(state)
    } else {
      // paused로 복구 (PRD 권장: 사용자 명시 재개)
      return { ...state, status: 'paused', remainingSeconds }
    }
  }

  return state
}
```

**복구 정책 (PRD 권장)**:
- `running` 상태 → `paused`로 복구 후 사용자가 Resume 클릭
- 이유: 자동 재개 시 사용자 부재 중 세션이 완료되는 혼란 방지

---

## 7. 영향 받는 파일 및 변경 예상 지점

### 7.1 `components/pomodoro-timer.tsx` (주요 변경)
| 라인 | 현재 | 변경 예상 |
|------|------|----------|
| 23-29 | 상태 변수 정의 | `phase`, `status` 분리, `completedSessions`/`longBreakCount` 영속화 |
| 96-104 | `targetEndAtMs` 초기화 | localStorage 저장 추가 |
| 106-127 | Tick 로직 | `status === 'paused'` 체크 추가 |
| 129-174 | TIME_UP 처리 | 중복 방지 플래그, localStorage 저장 |
| 176-186 | `handlePause`, `handleReset` | 상태 전환 명시화, 저장 |
| 216-234 | `handleSkip` | 상태 전환 명시화, 저장 |
| 52-76 | 초기 로드 | `rehydrateTimerState()` 추가 |

### 7.2 `lib/storage.ts` (선택적 확장)
- 현재: 단순 wrapper
- 변경: `getTimerState()`, `setTimerState()` 헬퍼 추가 (선택)

### 7.3 신규 파일 (선택적)
- `lib/timer-state-machine.ts`: 상태 전환 로직 순수 함수화 (테스트 용이성)
- `lib/timer-storage.ts`: localStorage 스키마 관리

### 7.4 테스트 파일 (신규)
- `__tests__/timer-state-machine.test.ts`: 상태 전환 유닛 테스트
- `tests/e2e/timer-pause-resume.spec.ts`: Pause/Resume E2E
- `tests/e2e/timer-rehydration.spec.ts`: 새로고침 복구 E2E

---

## 8. 마이그레이션 전략

### 8.1 기존 사용자 호환성
```typescript
// 신규 키가 없는 경우 기본값
const defaultTimerState = {
  version: 1,
  phase: 'focus',
  status: 'idle',
  remainingSeconds: settings.focusDuration * 60,
  targetEndAtMs: null,
  completedSessions: 0,
  longBreakCount: 0,
  lastUpdatedAtMs: Date.now()
}
```

### 8.2 스키마 버전 관리
```typescript
const migrateTimerState = (saved: any) => {
  if (!saved.version || saved.version === 1) {
    return saved
  }
  // 향후 버전 2, 3 마이그레이션 로직 추가
}
```

---

## 9. 구현 우선순위 (Phase 1, 2, 3)

### Phase 1: 상태 구조 변경 + Pause/Resume 기본 동작
- [ ] `phase`/`status` 분리
- [ ] `handlePause`/`handleResume` 구현
- [ ] Pause 중 카운트다운 정지 확인
- [ ] localStorage `pomodoro-timer-state` 저장/로드
- [ ] 기본 품질 게이트: `pnpm lint`, `pnpm build`

### Phase 2: 통계 정합성 + 00:00 경합 방지
- [ ] 중복 방지 플래그 추가
- [ ] Focus 완료/Skip 시 통계 정확성 검증
- [ ] `completedSessions`/`longBreakCount` 영속화
- [ ] 통계 불변 조건 유닛 테스트
- [ ] E2E: 롱브레이크 트리거 (4, 8, 12...)

### Phase 3: 새로고침 복구 + 접근성
- [ ] `rehydrateTimerState()` 구현
- [ ] `targetEndAtMs` 기반 복구 로직
- [ ] TIME_UP 경과 후 복구 처리
- [ ] E2E: 새로고침 복구 시나리오
- [ ] A11y: 포커스 트랩, ESC 닫기, aria-label
- [ ] 전체 품질 게이트: `pnpm e2e`

---

## 10. 리스크 및 완화 전략

### 리스크 1: 상태 전환 복잡도 증가
- **리스크**: 6개 상태 × N개 이벤트 = 전이 누락/중복 가능성
- **완화**:
  - 상태 전환 로직을 순수 함수로 분리 (`lib/timer-state-machine.ts`)
  - 유닛 테스트로 모든 전이 케이스 커버 (최소 80%)

### 리스크 2: 새로고침 복구 시간 보정 오류
- **리스크**: `targetEndAtMs` 계산 오류 시 통계 틀어짐
- **완화**:
  - 복구 로직을 단계별로 테스트 (paused, running, elapsed)
  - PRD 권장: `paused`로 복구하여 예측 가능성 확보

### 리스크 3: localStorage 파싱 오류
- **리스크**: 신규 키 추가로 예외 처리 누락 시 앱 크래시
- **완화**:
  - `try-catch` + 기본값 fallback
  - 스키마 버전 관리로 향후 마이그레이션 대비

### 리스크 4: 00:00 경계 경합
- **리스크**: 사용자 입력과 TIME_UP 동시 발생 시 중복 집계
- **완화**:
  - 플래그 기반 락 (`isTransitioning`)
  - E2E 테스트로 연타 시나리오 재현

---

## 11. 다음 단계 (Next Steps)

1. **설계 문서 리뷰**: 이 문서를 기반으로 설계 확정
2. **Task Master subtask 업데이트**: Subtask 4번 "Pause 상태를 포함한 상태 머신 설계"에 이 문서 링크
3. **Phase 1 구현 계획 수립**: `docs/plans/PLAN_pause-resume-phase1.md` 작성
4. **Context7 baseline 확인**: React hooks, localStorage 관련 API 확인 필요 시 baseline 조회

---

## 부록: PRD 핵심 요구사항 체크리스트

### 타이머/상태 (PRD Section 5)
- [x] Focus/Break/Long Break 각각에서 Pause/Resume 가능
- [x] Pause는 카운트다운 정지 + `remainingSeconds` 보존
- [x] Resume은 Pause 시점부터 재개
- [x] Pause/Resume은 통계에 영향 없음
- [x] 00:00 경계 경합 방지 (단 1회 전이/집계)
- [x] Pause 상태에서도 Skip/Reset 허용

### Skip/Reset (PRD Section 5)
- [x] Focus Skip: `completedSessions++`, 통계 불변
- [x] Break/Long Break Skip: Focus로 전환
- [x] Reset: 통계 완전 불변, 초기 Focus로

### 저장/복구 (PRD Section 7)
- [x] `pomodoro-timer-state` 스키마 정의
- [x] 새로고침 후 `phase`/`status`/`remainingSeconds` 복구
- [x] `targetEndAtMs` 기반 시간 보정
- [x] 경과 후 복구 시 TIME_UP 처리 (단 1회)
- [x] 기존 사용자 호환성 (마이그레이션)

### 접근성 (PRD Section 8)
- [ ] 키보드만으로 모든 버튼 조작 가능
- [ ] Dialog 포커스 트랩
- [ ] ESC 닫기 + 포커스 복귀
- [ ] 아이콘-only 버튼 aria-label
- [ ] Dialog 열림 중 전역 단축키 차단

### 테스트 (PRD Section 9)
- [ ] 유닛: 상태 전환 로직
- [ ] 통합: Pause/Resume/Skip/Reset UI
- [ ] E2E: 새로고침 복구
- [ ] E2E: 롱브레이크 트리거 (4, 8, 12...)
- [ ] E2E: 접근성 (키보드, 포커스)
- [ ] 품질 게이트: `pnpm lint`, `pnpm build`, `pnpm e2e`

---

**문서 종료**
