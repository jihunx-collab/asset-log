# 총 글 개수 표시 — Design

**Goal:** Home 페이지에 전체 글 개수를, Categories 인덱스 페이지에 카테고리별 글 개수를 보여준다.

**Architecture:** 새 lib 함수 없음. 기존 `getAllPostsMeta()`와 `getPostsByCategory()`가 이미 배열을 반환하므로, 각 페이지 컴포넌트에서 `.length`를 직접 사용한다.

## 변경 사항

### Home (`app/page.tsx`)
- 글 목록(`PostCard` 리스트) 위에 "총 {posts.length}편" 한 줄을 추가한다.
- 스타일: 기존 라벨 톤(`font-sans text-xs text-al-label`)을 따른다.
- 글이 0편일 때는 기존 "아직 글이 없습니다." 안내만 보이고 개수 줄은 표시하지 않는다.

### Categories 인덱스 (`app/categories/page.tsx`)
- 각 카테고리 링크 옆에 `getPostsByCategory(category).length`로 구한 개수를 `(N)`으로 붙인다. 예: `대체투자 (3)`.
- 카테고리가 0개(`아직 없음` 상태)일 때는 변경 없음.

## 테스트
- 순수 파생값(`array.length`)이라 `lib/posts.ts`에 새 로직이 없으므로 별도 유닛 테스트는 추가하지 않는다.
- `npm run build`로 빌드 성공을 확인하고, `npm run dev`로 Home과 Categories 페이지를 육안 확인한다.

## 범위 밖
- Nav에 개수 표시하지 않음(이번 라운드에서 제외, 사용자가 Home+Categories만 선택).
- 태그별 개수, 읽는 시간, 관련 글 등 다른 기능 제안은 이번 스펙에 포함하지 않음 — 별도 요청 시 각각 새 스펙으로 진행.
