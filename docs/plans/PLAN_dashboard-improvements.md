# 대시보드 개선 계획

## 1단계: TodayCard 목표 진행률 시각화

### 문제점
- 현재 `dailyGoal`이 pomodoro-timer.tsx 상태로만 관리됨
- DashboardLeft에서 목표 값을 알 수 없음

### 해결 방안
1. **localStorage에 설정 저장** (선택)
   - `lib/storage/local-settings.ts` 생성
   - 설정 저장/조회 함수 제공
   - pomodoro-timer.tsx에서 설정 변경 시 저장

2. **TodayCard에 진행률 바 추가**
   - `goalMinutes` prop 또는 localStorage에서 직접 조회
   - 기존 goal-progress.tsx 스타일 재사용
   - 목표 달성 시 체크 아이콘 + 색상 변경

### 구현 순서
```
1. lib/storage/local-settings.ts 생성
   - getSettings(): { dailyGoal: number, ... }
   - saveSettings(settings): void

2. pomodoro-timer.tsx 수정
   - 초기값: localStorage에서 로드
   - 설정 변경 시: localStorage에 저장

3. dashboard-left.tsx TodayCard 수정
   - goalMinutes를 localStorage에서 조회
   - Progress bar UI 추가
```

### DoD
- [ ] 설정이 localStorage에 저장/복원됨
- [ ] TodayCard에 진행률 바 표시
- [ ] 목표 달성 시 시각적 피드백
- [ ] pnpm build 통과

---

## 2단계: MonthlyCard 전월 대비 트렌드 (예정)

### 기능
- 전월 데이터 조회 함수 추가
- 전월 대비 증감률 표시 (↑12%, ↓5%)
- 간단한 비교 차트

---

## 3단계: 캘린더 호버/클릭 상세 (예정)

### 기능
- 날짜 호버 시 Tooltip으로 상세 정보
- 클릭 시 해당 날짜 세션 목록 (Popover)

---

## 4단계: 출석 스트릭 강화 (예정)

### 기능
- 연속 출석 일수 강조 표시
- 7일/30일 연속 출석 배지

---

## 5단계: 새 카드 추가 (예정)

### 후보
- 지난주 vs 이번주 비교 카드
- 베스트 기록 카드 (최고 집중 시간, 최장 스트릭)
