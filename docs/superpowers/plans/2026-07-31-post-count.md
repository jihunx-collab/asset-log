# 총 글 개수 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home 페이지에 전체 글 개수를, Categories 인덱스 페이지에 카테고리별 글 개수를 표시한다.

**Architecture:** 새 lib 함수를 추가하지 않는다. `lib/posts.ts`의 `getAllPostsMeta()`와 `getPostsByCategory()`가 이미 배열을 반환하므로, 각 페이지 컴포넌트에서 `.length`를 직접 사용해 개수를 구한다.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS. 새 의존성 없음.

## Global Constraints

- 색상/타이포 토큰은 기존 `al-*` Tailwind 클래스만 사용한다 (예: `text-al-label`, `font-sans`).
- 글이 0편인 상태(빈 목록)일 때는 개수 줄을 표시하지 않고 기존 안내 문구만 보인다.
- 저장소는 `/Users/jihun/dev/Website` — `my-investor-club-workspace`와 무관, 그 레포에 파일을 추가하거나 참조하지 않는다.
- 새 유닛 테스트는 추가하지 않는다 (순수 파생값이라 `lib/posts.ts`에 새 로직 없음) — 검증은 `npm run build` + `npm run dev` 육안 확인으로 한다.

---

### Task 1: Home 페이지에 총 글 개수 표시

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getAllPostsMeta()` from `lib/posts.ts` (기존 함수, 시그니처 변경 없음) — `PostMeta[]` 반환.
- Produces: 없음 (페이지 컴포넌트, 다른 태스크가 이 파일을 참조하지 않음).

현재 `app/page.tsx` 전체 내용:

```tsx
import { getAllPostsMeta } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  const posts = getAllPostsMeta();

  if (posts.length === 0) {
    return <p className="font-sans text-sm text-al-muted">아직 글이 없습니다.</p>;
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
```

- [ ] **Step 1: `app/page.tsx`에 총 개수 줄 추가**

`return (` 블록을 아래로 교체 (빈 목록 분기는 그대로 두고, 글이 있을 때의 return만 수정):

```tsx
import { getAllPostsMeta } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  const posts = getAllPostsMeta();

  if (posts.length === 0) {
    return <p className="font-sans text-sm text-al-muted">아직 글이 없습니다.</p>;
  }

  return (
    <div>
      <p className="font-sans text-xs text-al-label mb-6">총 {posts.length}편</p>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jihun/dev/Website && npm run build`
Expected: exit code 0, 에러 없음.

- [ ] **Step 3: 육안 확인**

```bash
cd /Users/jihun/dev/Website && npm run dev
```

`http://localhost:3000` 접속 — Nav 아래, 첫 `PostCard` 위에 "총 11편"(현재 `content/posts/`의 `.md` 파일 개수만큼)이 라벨 톤(연한 회색, 작은 글씨)으로 보이는지 확인. 확인 후 Ctrl+C로 dev 서버 종료.

- [ ] **Step 4: Commit**

```bash
cd /Users/jihun/dev/Website
git add app/page.tsx
git commit -m "feat: show total post count on home page"
```

---

### Task 2: Categories 인덱스 페이지에 카테고리별 개수 표시

**Files:**
- Modify: `app/categories/page.tsx`

**Interfaces:**
- Consumes: `getAllCategories()`, `getPostsByCategory(category: string)` from `lib/posts.ts` (기존 함수, 시그니처 변경 없음) — 각각 `string[]`, `PostMeta[]` 반환.
- Produces: 없음.

현재 `app/categories/page.tsx` 전체 내용:

```tsx
import Link from "next/link";
import { getAllCategories } from "@/lib/posts";

export default function CategoriesIndexPage() {
  const categories = getAllCategories();

  return (
    <div>
      <h1 className="font-serif text-xl text-al-silver mb-6">Categories</h1>
      {categories.length === 0 ? (
        <p className="font-sans text-sm text-al-muted">아직 없음</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`/categories/${encodeURIComponent(category)}`}
                className="font-sans text-sm text-al-sage"
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 1: `app/categories/page.tsx`에 카테고리별 개수 추가**

`getPostsByCategory`를 import하고, 각 `<li>` 안에서 해당 카테고리의 글 개수를 구해 `(N)`으로 붙인다:

```tsx
import Link from "next/link";
import { getAllCategories, getPostsByCategory } from "@/lib/posts";

export default function CategoriesIndexPage() {
  const categories = getAllCategories();

  return (
    <div>
      <h1 className="font-serif text-xl text-al-silver mb-6">Categories</h1>
      {categories.length === 0 ? (
        <p className="font-sans text-sm text-al-muted">아직 없음</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`/categories/${encodeURIComponent(category)}`}
                className="font-sans text-sm text-al-sage"
              >
                {category}
                <span className="text-al-muted"> ({getPostsByCategory(category).length})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jihun/dev/Website && npm run build`
Expected: exit code 0, 에러 없음.

- [ ] **Step 3: 육안 확인**

```bash
cd /Users/jihun/dev/Website && npm run dev
```

`http://localhost:3000/categories` 접속 — 각 카테고리 옆에 `(N)` 개수가 sage 색 카테고리명 뒤, 연한 회색(`al-muted`)으로 붙어 보이는지 확인 (예: `대체투자 (3)`). 확인 후 Ctrl+C로 dev 서버 종료.

- [ ] **Step 4: Commit**

```bash
cd /Users/jihun/dev/Website
git add app/categories/page.tsx
git commit -m "feat: show per-category post count on categories index"
```

---

## Self-Review Notes

- **Spec coverage:** Home 총 개수(Task 1), Categories 카테고리별 개수(Task 2), 0편/0개일 때 개수 줄 숨김(두 태스크 모두 기존 빈 상태 분기를 건드리지 않음으로써 충족) — 스펙의 모든 항목이 커버됨.
- **테스트:** 스펙이 유닛 테스트 불필요라고 명시했으므로 각 태스크는 build + 육안 확인만 포함.
- **타입 일관성:** `PostMeta`, `getAllPostsMeta()`, `getAllCategories()`, `getPostsByCategory(category: string)` 모두 기존 `lib/posts.ts` 시그니처 그대로 사용, 변경 없음.
- **범위 밖 확인:** Nav 표시, 태그/읽는시간 등은 스펙에서 명시적으로 제외했으므로 이 플랜에 포함하지 않음.
