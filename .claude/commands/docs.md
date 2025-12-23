- Canonical paths: docs/context7-baseline.json
- Lookup key: topicName

$ARGUMENTS

목표: 외부 라이브러리/프레임워크 문서 확인이 필요할 때만 context7을 사용한다.
- context7으로 관련 최신 문서 스니펫을 가져오고,
- pomobox 코드에 적용 시 주의점을 3가지로 정리한다.
- 먼저 docs/context7-baseline.json에서 topicName으로 검색
- 존재하면 Context7 호출 금지, baseline 재사용
- 없으면 1회 호출 후 baseline에 기록(스키마 준수)
- baseline에 기록하는 7개 필드: topicName, context7CompatibleLibraryID, topic, pageRange, retrievedAt, keyAPIs/constraints, appliesToFiles
- 새 entry는 docs/context7-baseline.json 배열에 append(기존 topic이면 append 금지)