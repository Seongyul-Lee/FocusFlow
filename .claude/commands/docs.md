- Canonical paths: docs/context7-baseline.json
- Lookup key: topicName

$ARGUMENTS

목표: 작업 시작 시 자동으로 Context7을 조회하여 최신 문서 기반으로 코드를 작성한다 (200/day 적극 활용).

## 자동 조회 트리거 (파일 타입별)
작업 중인 파일에 따라 자동으로 관련 문서 조회:
- `app/**/*.tsx`, `app/**/*.ts` → `/vercel/next.js` 관련 문서
- `components/**/*.tsx` → React Hooks, Radix UI
- `lib/**/*.ts` → 사용 중인 라이브러리 (zod, date-fns 등)
- `tests/**/*.ts` → Playwright, Testing Library
- 기타: 필요 시 Claude 판단

## 실행 흐름
1. **Baseline 확인**: docs/context7-baseline.json에서 topicName + retrievedAt 검색
2. **당일 캐시 존재**: baseline 데이터 재사용 (Context7 호출 안 함)
3. **다른 날 또는 없음**:
   - Context7 자동 조회 (resolve-library-id → get-library-docs)
   - 조회 결과를 baseline에 기록/업데이트
   - pomobox 코드 적용 시 주의점 3가지 정리

## Baseline 기록 스키마 (필수 7개 필드)
- `topicName`: 고유 식별자 (예: "nextjs-server-actions-2025-12-24")
- `context7CompatibleLibraryID`: Context7 라이브러리 ID
- `topic`: 조회한 주제
- `pageRange`: 조회한 페이지 범위
- `retrievedAt`: ISO 8601 날짜 (예: "2025-12-24T00:00:00Z")
- `keyAPIs`: 핵심 API 목록 (배열)
- `constraints`: 제약사항/주의사항 (배열)
- `appliesToFiles`: 적용 대상 파일 패턴 (배열)

## 캐시 갱신 정책
- **당일**: 같은 topicName 재사용 (호출 안 함)
- **다음 날**: retrievedAt 날짜가 다르면 자동 재조회하여 최신 문서 반영
- **업데이트**: 기존 topicName entry를 새 데이터로 교체

## 예시
```
작업: components/settings-dialog.tsx 수정
→ 자동 조회: /radix-ui/primitives "dialog focus trap keyboard"
→ Baseline 확인: "radix-dialog-focus-trap" (2025-12-23)
→ 다른 날이므로 재조회 → baseline 업데이트 (2025-12-24)
→ 최신 Dialog API로 코드 작성
```

## 주의사항
- 할당량 200/day를 적극 활용 (일일 15-30회 예상)
- 같은 topic은 하루 1회만 조회 (자정 지나면 자동 갱신)
- Baseline은 append 방식 (기존 topicName 존재 시 update)
