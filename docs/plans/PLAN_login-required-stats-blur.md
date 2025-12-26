# Plan: 비로그인 통계 블러 처리

## 목표
비로그인 상태에서 Weekly Stats, This Week vs Last Week, Monthly Stats 콘텐츠를 블러 처리하고 로그인 유도 요소 표시

## 변경 사항

### 1. dashboard-left.tsx
- `LoginRequiredOverlay` 컴포넌트 추가 (자물쇠 아이콘 + 로그인 유도 텍스트)
- `WeeklyCard`, `WeeklyComparisonCard`, `MonthlyCard`에 `isLoggedIn` prop 추가
- 비로그인 시 CardContent에 `blur-sm` 클래스 + 오버레이 표시
- CardHeader(제목)는 블러 처리 안 함

### 2. 블러 처리 방식
```tsx
<CardContent className="relative">
  <div className={!isLoggedIn ? "blur-sm pointer-events-none" : ""}>
    {/* 기존 콘텐츠 */}
  </div>
  {!isLoggedIn && <LoginRequiredOverlay />}
</CardContent>
```

## 영향받는 기능
- Activity Calendar: 변경 없음 (완전 활성화 유지)
- TodayCard: 변경 없음 (로컬 데이터로 동작)

## DoD
- [x] 비로그인 시 3개 카드 콘텐츠 블러
- [x] 제목은 정상 표시
- [x] 로그인 유도 오버레이 표시
- [x] pnpm lint && pnpm build 통과
