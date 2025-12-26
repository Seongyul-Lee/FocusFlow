# 상세 워크플로우 가이드

> 이 문서는 `CLAUDE.md`의 상세 보충 자료입니다.
> 핵심 규칙은 `CLAUDE.md`를 참조하세요.

---

## 1. 워크플로우 상세

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

# 2. Plan 수립 (강제)
/plan

# 3. 문서 조회 (강제)
/docs <관련 라이브러리/프레임워크>

# 4. 구현 + 품질 게이트
pnpm lint && pnpm build

# 5. Task 생성 + 상태 업데이트 (강제)
task-master에 추가 후 done 처리
```

**사용 시기**: 버그 수정, 긴급 요청, 실험적 기능

---

## 2. 세션 재시작 시 컨텍스트 복구

새 터미널에서 `claude` 실행 시:

```bash
# Step 1: Task Master 상태 확인
task-master get-tasks status="in-progress,pending"

# Step 2: Git 상태 확인
git log -5 --oneline
git status
```

**복구 우선순위**:
1. Task Master 상태 = SSOT
2. in-progress task → 재개
3. 없으면 → `task-master next` 또는 사용자 요청 대기

---

## 3. Task Master 운영 규칙

### 크기 제한 (토큰 초과 방지)

**Task 생성 규칙**:
- `details`: 3줄 이내
- `description`: 1-2문장
- `testStrategy`: 1줄
- Subtask: 최대 5개

**조회 규칙**:
- `get_tasks`: 반드시 status 필터 사용
- 특정 task: `get_task(id="11")`

**아카이브**:
- Phase 완료 시 → `archived-tasks.json`으로 이동
- tasks.json: 10-15개 유지

---

## 4. Context7 운영 규칙

### 자동 조회 트리거 (파일 타입별)

| 파일 패턴 | 조회 대상 |
|-----------|----------|
| `app/**/*.tsx` | `/vercel/next.js` |
| `components/**/*.tsx` | React Hooks, Radix UI |
| `lib/**/*.ts` | zod, date-fns 등 |
| `tests/**/*.ts` | Playwright |

### Baseline 스키마 (필수 7개 필드)

```json
{
  "topicName": "nextjs-server-actions",
  "context7CompatibleLibraryID": "/vercel/next.js",
  "topic": "server actions",
  "pageRange": "1",
  "retrievedAt": "2025-12-25T00:00:00Z",
  "keyAPIs": ["useFormState", "useFormStatus"],
  "constraints": ["Server Actions must be async"],
  "appliesToFiles": ["app/**/actions.ts"]
}
```

### 캐시 전략

1. 작업 시작 → baseline에서 topicName + retrievedAt 확인
2. 당일 캐시 존재 → 재사용
3. 다른 날 또는 없음 → 자동 조회 후 업데이트

---

## 5. Hook 강제 메커니즘 상세

### 파일 구조

```
.claude/
├── hooks/
│   └── enforce-docs.js
└── settings.json
```

### 동작 흐름

```
Edit/Write 호출
    ↓
enforce-docs.js 실행
    ↓
context7-baseline.json 확인
    ↓
오늘 항목 있음? → 허용
오늘 항목 없음? → 차단 + 메시지
```

### 면제 경로

| 경로 | 이유 |
|------|------|
| `docs/` | 문서 작업 |
| `.claude/` | 설정 파일 |
| `.taskmaster/` | Task Master |
| `messages/` | i18n |
| `public/` | 정적 에셋 |
| `*.md`, `*.json`, `*.txt` | 설정/문서 |

---

## 6. 금지 사항 체크리스트

- [ ] /plan 없이 코드 수정 시작
- [ ] /docs 없이 외부 라이브러리 사용
- [ ] task-master set-status 없이 커밋
- [ ] "다음 단계" 요청 시 task-master next 없이 진행
- [ ] Task Master 전체 조회 (status 필터 없이)
- [ ] .env/비밀키 읽기 또는 출력
- [ ] 임의 대규모 리팩터링 제안
