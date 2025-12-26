# Plan: 실시간 통계 동기화

## 목표
타이머와 Dashboard 통계(Daily Goal, Today Focus, Weekly Min, Monthly Total)가 실시간으로 동기화

## 요구사항
- Focus 세션 중에만 실시간 증가 (휴식 X)
- 분 단위 표시 (0m → 1m → 2m)
- Reset 시 경과 시간 저장 (로그인: Supabase, 비로그인: localStorage)
- 저장된 시간 + 실시간 경과 시간 = 표시 시간

## 구현 단계

### Phase 1: TimerContext 생성
**파일**: `contexts/timer-context.tsx`
```typescript
interface TimerContextValue {
  isRunning: boolean
  isFocusPhase: boolean
  sessionStartTime: number | null  // timestamp (ms)
  elapsedMinutes: number           // 실시간 경과 분
}
```

### Phase 2: PomodoroTimer 수정
- Context Provider로 감싸기
- Start 시 sessionStartTime 설정
- Pause/Reset 시 sessionStartTime = null
- Reset 시 경과 시간 저장 (신규)

### Phase 3: 실시간 경과 시간 훅
**파일**: `hooks/use-realtime-focus.ts`
- Context에서 상태 구독
- 1초마다 elapsedMinutes 계산 (분 변경 시만 리렌더)

### Phase 4: Dashboard 컴포넌트 연동
- TodayCard: todayMinutes + realtimeMinutes
- WeeklyCard: weeklyMinutes + realtimeMinutes
- MonthlyCard: monthlyMinutes + realtimeMinutes
- GoalProgress: currentMinutes + realtimeMinutes

### Phase 5: 저장 로직 수정
- handleReset에 경과 시간 저장 추가
- recordLocalSession(elapsedMinutes) - 분 단위
- recordSessionComplete(userId, elapsedMinutes) - 분 단위

## 영향받는 파일
1. `contexts/timer-context.tsx` (신규)
2. `hooks/use-realtime-focus.ts` (신규)
3. `components/pomodoro-timer.tsx` (수정)
4. `components/dashboard-left.tsx` (수정)
5. `components/goal-progress.tsx` (수정)
6. `app/[locale]/page.tsx` (Provider 추가)

## DoD
- [ ] Focus 중 Dashboard 통계 실시간 증가
- [ ] Reset 시 경과 시간 저장
- [ ] 휴식 중에는 증가 안 함
- [ ] pnpm lint && pnpm build 통과
