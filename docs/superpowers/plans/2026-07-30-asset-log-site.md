# Asset Log Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Asset Log blog/portfolio site — a Next.js site that reads posts from markdown files and renders Home, post detail, category, and about pages in the approved dark-navy/silver-serif/sage-accent design, deployed to Vercel.

**Architecture:** Next.js (App Router) reads markdown files from `content/posts/*.md` at request/build time via a small content library (`lib/posts.ts`) that parses frontmatter, validates required fields, and converts markdown bodies to HTML. Pages are server components that call this library directly — no database, no CMS, no client-side data fetching.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, gray-matter, remark + remark-html, Vitest (unit tests for the content library), deployed on Vercel.

## Global Constraints

- Required frontmatter fields: `title`, `date`, `category` — missing any of these must throw an error, not silently default (spec: "빌드 시점에 에러로 표시한다").
- Category pages with zero posts show the literal text "아직 없음" instead of an empty page.
- Footer disclaimer, exact text (approved in the brainstorm mockup): "본 글은 투자 권유가 아닌 개인 학습 목적의 분석입니다."
- Color tokens (exact hex, approved in brainstorm): background `#12181f`, headline `#c7cdd6`, accent `#7a9a8e`, label `#8a8f98`, muted text `#6b7078`, divider `#232b35`, dark footer background `#0e131a`.
- Typography: headlines in serif (`Georgia, "Noto Serif KR", serif`), UI text/labels in sans-serif (`-apple-system` stack) — the contrast between the two is intentional, keep it.
- Logo (`IMG_0794.jpg`) is used only as a small nav mark (32px) and favicon — never as a large home-page banner (explicitly rejected during brainstorming).
- Repository lives at `~/dev/Website`, fully separate from `~/dev/my-investor-club-workspace` — do not add files to or read runtime config from that other repo.
- New GitHub repo is **public**.

---

### Task 1: Project Scaffold (Next.js + TypeScript + Tailwind + Vitest)

**Files:**
- Create: full Next.js scaffold (`package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/`, `.eslintrc.json` or `eslint.config.mjs`)
- Create: `vitest.config.ts`
- Modify: `package.json` (add `"test": "vitest run"` script, add `vitest` devDependency)
- Test (temporary, removed at end of this task): `lib/sanity.test.ts`

**Interfaces:**
- Produces: a Next.js app that builds with `npm run build`, and a working `npx vitest run` test runner that Task 2 will add real tests to.

- [ ] **Step 1: Scaffold the Next.js app**

Run this in `/Users/jihun/dev/Website` (the directory already has `.git/`, `.gitignore`, `docs/`, and `IMG_0794.jpg` — that's expected, `create-next-app` will just note the existing files and continue):

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

If it drops into interactive prompts instead of running non-interactively, answer: TypeScript = Yes, ESLint = Yes, Tailwind = Yes, `src/` directory = No, App Router = Yes, import alias = `@/*`, Turbopack = default/No.

- [ ] **Step 2: Remove unused boilerplate**

Delete the default demo content `create-next-app` generates so later tasks start from a clean slate:

```bash
rm -f public/next.svg public/vercel.svg public/globe.svg public/file.svg public/window.svg
```

Leave `app/layout.tsx`, `app/page.tsx`, `app/globals.css` in place — Task 4/5 will overwrite them.

- [ ] **Step 3: Verify the scaffold builds**

```bash
npm run build
```

Expected: build completes with no errors (exit code 0).

- [ ] **Step 4: Add Vitest**

```bash
npm install -D vitest
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
```

Add to `package.json` `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 5: Write a temporary sanity test and confirm the runner works**

Create `lib/sanity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('vitest sanity check', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npx vitest run`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 6: Remove the temporary sanity test**

```bash
rm lib/sanity.test.ts
```

(Task 2 adds the first real test file in `lib/`.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript, Tailwind, Vitest"
```

---

### Task 2: Content Library (`lib/posts.ts`)

**Files:**
- Create: `lib/posts.ts`
- Test: `lib/posts.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure library, only reads from a `postsDir` it's given).
- Produces (used by Tasks 5, 6, 7):
  - `interface PostMeta { slug: string; title: string; date: string; category: string; tags: string[]; excerpt: string }`
  - `getAllPostsMeta(postsDir?: string): PostMeta[]` — sorted by `date` descending, throws `Error` if any post is missing `title`/`date`/`category`
  - `getAllCategories(postsDir?: string): string[]` — unique categories
  - `getPostsByCategory(category: string, postsDir?: string): PostMeta[]`
  - `getPostContent(slug: string, postsDir?: string): Promise<{ meta: PostMeta; contentHtml: string } | null>` — `null` if the slug doesn't exist
  - Default posts directory: `content/posts/` at the project root (used when no `postsDir` argument is passed)

- [ ] **Step 1: Install markdown/frontmatter dependencies**

```bash
npm install gray-matter remark remark-html
```

- [ ] **Step 2: Write the failing tests**

Create `lib/posts.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getAllPostsMeta,
  getAllCategories,
  getPostsByCategory,
  getPostContent,
} from './posts';

describe('posts library', () => {
  let fixturesDir: string;

  beforeAll(() => {
    fixturesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-fixtures-'));
    fs.writeFileSync(
      path.join(fixturesDir, 'post-a.md'),
      `---\ntitle: "글 A"\ndate: 2026-01-01\ncategory: RWA\ntags: [테스트]\n---\n\n# 제목\n\n첫 번째 글 본문입니다.`
    );
    fs.writeFileSync(
      path.join(fixturesDir, 'post-b.md'),
      `---\ntitle: "글 B"\ndate: 2026-02-01\ncategory: STO\n---\n\n두 번째 글 본문입니다.`
    );
  });

  afterAll(() => {
    fs.rmSync(fixturesDir, { recursive: true, force: true });
  });

  it('lists all posts sorted by date descending', () => {
    const posts = getAllPostsMeta(fixturesDir);
    expect(posts.map((p) => p.slug)).toEqual(['post-b', 'post-a']);
  });

  it('defaults tags to an empty array when omitted', () => {
    const posts = getAllPostsMeta(fixturesDir);
    const postB = posts.find((p) => p.slug === 'post-b');
    expect(postB?.tags).toEqual([]);
  });

  it('collects unique categories', () => {
    expect(getAllCategories(fixturesDir).sort()).toEqual(['RWA', 'STO']);
  });

  it('filters posts by category', () => {
    const rwaPosts = getPostsByCategory('RWA', fixturesDir);
    expect(rwaPosts.map((p) => p.slug)).toEqual(['post-a']);
  });

  it('renders markdown body to HTML for a single post', async () => {
    const result = await getPostContent('post-a', fixturesDir);
    expect(result?.contentHtml).toContain('<p>첫 번째 글 본문입니다.</p>');
  });

  it('returns null for a slug that does not exist', async () => {
    const result = await getPostContent('does-not-exist', fixturesDir);
    expect(result).toBeNull();
  });
});

describe('posts library — invalid frontmatter', () => {
  let fixturesDir: string;

  beforeAll(() => {
    fixturesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-invalid-fixtures-'));
    fs.writeFileSync(
      path.join(fixturesDir, 'missing-fields.md'),
      `---\ntitle: "제목만 있음"\n---\n\n본문.`
    );
  });

  afterAll(() => {
    fs.rmSync(fixturesDir, { recursive: true, force: true });
  });

  it('throws a descriptive error when required frontmatter is missing', () => {
    expect(() => getAllPostsMeta(fixturesDir)).toThrow(/date/);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run`
Expected: FAIL — `lib/posts.ts` does not exist yet (module not found).

- [ ] **Step 4: Implement `lib/posts.ts`**

```typescript
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const DEFAULT_POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
}

function makeExcerpt(body: string, maxLength = 80): string {
  const plain = body
    .replace(/^#+\s.*$/gm, '')
    .replace(/[#*_`>]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}

function parsePostFile(dir: string, filename: string): PostMeta & { body: string } {
  const slug = filename.replace(/\.md$/, '');
  const raw = fs.readFileSync(path.join(dir, filename), 'utf-8');
  const { data, content } = matter(raw);

  const missing = ['title', 'date', 'category'].filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`${filename}: frontmatter에 필수 항목이 없습니다 (${missing.join(', ')})`);
  }

  return {
    slug,
    title: data.title,
    date: String(data.date),
    category: data.category,
    tags: data.tags ?? [],
    excerpt: makeExcerpt(content),
    body: content,
  };
}

export function getAllPostsMeta(postsDir: string = DEFAULT_POSTS_DIR): PostMeta[] {
  const filenames = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  const posts = filenames.map((filename) => {
    const { body, ...meta } = parsePostFile(postsDir, filename);
    return meta;
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllCategories(postsDir: string = DEFAULT_POSTS_DIR): string[] {
  const posts = getAllPostsMeta(postsDir);
  return Array.from(new Set(posts.map((p) => p.category)));
}

export function getPostsByCategory(
  category: string,
  postsDir: string = DEFAULT_POSTS_DIR
): PostMeta[] {
  return getAllPostsMeta(postsDir).filter((p) => p.category === category);
}

export async function getPostContent(
  slug: string,
  postsDir: string = DEFAULT_POSTS_DIR
): Promise<{ meta: PostMeta; contentHtml: string } | null> {
  const filename = `${slug}.md`;
  if (!fs.existsSync(path.join(postsDir, filename))) {
    return null;
  }
  const { body, ...meta } = parsePostFile(postsDir, filename);
  const processed = await remark().use(html).process(body);
  return { meta, contentHtml: processed.toString() };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/posts.ts lib/posts.test.ts package.json package-lock.json
git commit -m "feat: add content library for parsing and validating markdown posts"
```

---

### Task 3: Seed Content

**Files:**
- Create: `content/posts/pe-alpha-2026-07-25.md`
- Create: `content/about.md`

**Interfaces:**
- Consumes: `lib/posts.ts` from Task 2 (this task's markdown files are what `getAllPostsMeta()` will read at its default path).
- Produces: real content for Tasks 5–8 to render (no empty-state pages during development).

- [ ] **Step 1: Add the seed post**

This is the existing, already fact-checked draft from `my-investor-club-workspace/outputs/blog-drafts/pe-alpha-2026-07-25.md`, with frontmatter added and the internal "출처 확인 로그" section (verification notes, not reader-facing) removed. Create `content/posts/pe-alpha-2026-07-25.md`:

```markdown
---
title: "PE 비즈니스 모델의 핵심: 사모펀드는 어떻게 '알파'를 창출하는가"
date: 2026-07-25
category: 대체투자
tags: [PE, 사모펀드, 바이아웃]
---

안녕하세요, Asset Log입니다.

2025년 국내 최대 바이아웃 딜은 한앤컴퍼니의 SK스페셜티 인수였습니다. 인수 금액은 2조7,008억원.

그런데 같은 시기, 국내 최대 사모펀드 운용사 중 한 곳인 MBK파트너스는 정반대의 국면에 있었습니다. 2015년 7조6,800억원에 인수했던 홈플러스가 법인회생 절차에 들어갔고, 회생계획 이행 가능성 부족으로 이 절차는 1년 4개월 만에 중단됐습니다.

같은 업종(PE), 같은 시기, 정반대의 결과. 이 글에서는 사모펀드(PEF)가 구조적으로 어떻게 수익을 만들어내도록 설계되어 있는지, 그리고 그 설계가 왜 항상 성공을 보장하지는 않는지를 살펴보겠습니다.

## 본문

### 1. GP와 LP — 누가 돈을 대고 누가 굴리는가

PEF는 두 종류의 참여자로 구성됩니다.

LP(Limited Partner)는 펀드에 자금을 위탁하는 투자자입니다. 연기금, 공제회, 보험사 같은 기관투자자가 대부분을 차지합니다.

GP(General Partner)는 그 자금을 실제로 운용하는 주체입니다. 투자 대상을 고르고, 인수 구조를 짜고, 인수 후 기업가치를 끌어올린 뒤 되파는 전 과정을 책임집니다.

GP는 자기 돈을 많이 넣지 않습니다. 대신 LP의 자본을 지렛대 삼아 운용 능력으로 보상을 받는 구조입니다. 이 보상 체계를 만드는 게 다음에 다룰 캐리드 인터레스트입니다.

### 2. 캐리드 인터레스트 — '알파'가 보상으로 바뀌는 방식

GP의 수익은 크게 두 가지입니다. 매년 걷는 운용보수(management fee), 그리고 성과에 따라 받는 캐리드 인터레스트(carried interest, 흔히 '캐리'라 부릅니다)입니다.

캐리는 아무 수익에나 붙지 않습니다. LP가 먼저 일정 수익률(허들 레이트, hurdle rate)을 돌려받은 다음에야 GP 몫이 발생하는 구조입니다. 바이아웃 펀드는 연 8%를 허들 레이트로 쓰는 게 업계 표준이고, 캐리 비율 자체는 통상 20% 수준입니다.

정리하면 이렇습니다.

- 1단계: LP가 원금 회수
- 2단계: LP가 허들 레이트(통상 연 8%)만큼 우선 수익 회수
- 3단계: 그 이상 수익에서 GP가 캐리(통상 20%)를 가져감

이 워터폴(waterfall) 구조가 GP에게 "허들을 넘는 초과수익, 즉 알파를 만들어야만 돈을 번다"는 유인을 만듭니다. 운용보수만으로는 큰돈이 안 되고, 캐리를 받으려면 실제로 기업가치를 올려야 하는 셈입니다.

### 3. 알파는 거저 나오지 않는다 — 레버리지라는 양날의 검

여기서 질문이 하나 생깁니다. GP는 실제로 어떻게 8% 허들을 넘는 초과수익을 만들어낼까요.

바이아웃 PE의 전형적인 방식은 인수금융, 즉 차입(레버리지)을 일으켜 기업을 인수한 뒤 현금흐름 개선·비용 효율화·사업 재편으로 기업가치를 끌어올려 되파는 것입니다. 레버리지는 자기자본수익률을 증폭시키는 도구입니다. 잘 되면 적은 자기자본으로도 큰 수익률을 냅니다.

그런데 이 증폭 효과는 반대 방향으로도 작동합니다.

MBK파트너스가 2015년 7조6,800억원에 인수한 홈플러스는 2024년 11월 말 기준 총차입금 5조4,620억원, 부채비율 1,408%까지 늘어난 상태로 2025년 3월 법인회생을 신청했습니다. 이후 서울중앙지검은 MBK 경영진이 회생 신청 전 재무제표를 조작하는 등 분식회계 혐의가 있다고 보고 구속영장을 청구했다고 보도됐습니다 — 이 혐의는 아직 사법 절차가 진행 중인 사안입니다.

반면 같은 시기 한앤컴퍼니는 SK스페셜티(반도체 특수가스 1위 업체) 인수를 2025년 최대 바이아웃 딜로 성사시키며, 2026년 1월 더벨 리그테이블 어워즈에서 '베스트 PE 하우스'로 선정됐습니다.

두 사례가 보여주는 것은 같습니다. PE의 알파는 레버리지를 얼마나 잘 다루느냐, 그리고 인수 이후 실제로 기업가치를 개선할 역량이 있느냐에 달려 있다는 점입니다. 구조 자체는 중립적이고, 그 구조를 다루는 실행력이 결과를 가릅니다.

### 4. 최근 엑시트 전략의 변화 — 통매각에서 블록딜·세컨더리로

알파를 만드는 것 못지않게 중요한 건 그걸 현금화하는 방법, 즉 엑시트(exit)입니다.

과거 국내 PEF의 엑시트는 경영권 전체를 한 번에 넘기는 통매각이나 IPO가 중심이었습니다. 그런데 최근에는 지분을 시간을 두고 나눠 파는 블록딜(시간외 대량매매), PEF끼리 자산을 주고받는 세컨더리 거래, 회수 시점을 미루는 컨티뉴에이션 펀드 활용이 늘어나는 추세로 보도되고 있습니다.

이런 변화의 배경에는 한국 시장 특유의 구조적 한계가 있습니다. IPO 시장이 부진하고 전략적 인수자 저변이 좁다 보니, 회수 채널 자체가 제한적이라는 지적입니다. 삼성증권 리서치센터는 2025년 11월 보고서에서 테크/AI 관련 주가 상승에 따른 밸류에이션 갭 확대, 금리 인하, 정책 불확실성 완화가 맞물리며 2026년 엑시트 시장이 개선될 것으로 전망했습니다 — 다만 이는 해당 리서치센터의 전망치이며 확정된 결과가 아닙니다.

## 마무리하며

PE의 비즈니스 모델은 결국 "LP의 자본 + GP의 실행력 + 레버리지"라는 세 요소의 조합입니다. 이 조합이 잘 맞물리면 한앤컴퍼니처럼 업계 베스트로 평가받고, 어긋나면 홈플러스처럼 회생 절차로 이어질 수 있습니다.

제가 이 구조에서 계속 주목하는 지점은, 캐리 구조 자체보다 그 캐리를 받기 위해 GP가 어떤 실행 전략(레버리지 수준, 엑시트 채널)을 택하는지입니다. 이 관전 포인트는 다음 Asset Log 글에서 국내 PE 개별 하우스의 전략 비교로 이어가 보겠습니다.

본 글은 투자 권유가 아닌 개인 학습 목적의 분석입니다. 모든 수치는 2026년 7월 기준이며, 공개된 자료를 바탕으로 작성됐습니다.
```

- [ ] **Step 2: Add an About page content file**

`content/about.md` — honest placeholder (no fabricated biography), meant for the site owner to edit later:

```markdown
# About

이 사이트는 **Asset Log**라는 이름으로 대체투자(사모펀드·RWA·STO 등)를 공부하고 기록하는 개인 아카이브입니다.

자기소개는 아직 준비 중입니다 — 곧 채워 넣을 예정입니다.
```

- [ ] **Step 3: Verify the seed post is picked up**

Run: `npx vitest run` (should still pass — this task doesn't touch `lib/`)

Then run this one-off check:

```bash
node -e "
require('ts-node/register') || true;
" 2>/dev/null
npx tsx -e "
import('./lib/posts.ts').then(async (m) => {
  const posts = m.getAllPostsMeta();
  console.log(posts.map(p => p.slug));
  const content = await m.getPostContent('pe-alpha-2026-07-25');
  console.log(content?.meta.title);
});
"
```

Expected output: `[ 'pe-alpha-2026-07-25' ]` followed by the post title. (If `tsx` isn't available, run `npm install -D tsx` first — it's a dev-only convenience for this manual check, not a runtime dependency.)

- [ ] **Step 4: Commit**

```bash
git add content/
git commit -m "content: add seed post (PE alpha) and about page draft"
```

---

### Task 4: Design Tokens & Shared Layout

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `components/Nav.tsx`
- Create: `components/Footer.tsx`
- Create: `app/icon.jpg` (favicon, copied from the existing logo)
- Create: `public/logo.jpg` (nav mark image, copied from the existing logo)

**Interfaces:**
- Consumes: nothing from Tasks 2–3.
- Produces: `<Nav>` and `<Footer>` components and the `al-*` Tailwind color tokens that Tasks 5–8's pages build on.

- [ ] **Step 1: Copy the logo into place**

```bash
cp IMG_0794.jpg public/logo.jpg
cp IMG_0794.jpg app/icon.jpg
```

- [ ] **Step 2: Set up Tailwind color and font tokens**

Replace `tailwind.config.ts` content section with:

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "al-navy": "#12181f",
        "al-navy-dark": "#0e131a",
        "al-silver": "#c7cdd6",
        "al-sage": "#7a9a8e",
        "al-label": "#8a8f98",
        "al-muted": "#6b7078",
        "al-divider": "#232b35",
      },
      fontFamily: {
        serif: ["Georgia", "'Noto Serif KR'", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
    },
  },
} satisfies Config;
```

(If the scaffold generated Tailwind v4's CSS-first config instead of `tailwind.config.ts`, add the same tokens as `@theme` custom properties in `app/globals.css` instead — same names, same values.)

- [ ] **Step 3: Add prose styling for rendered markdown**

Append to `app/globals.css`:

```css
.prose-content h1,
.prose-content h2,
.prose-content h3 {
  font-family: Georgia, "Noto Serif KR", serif;
  margin-top: 1.5em;
  margin-bottom: 0.6em;
}
.prose-content p {
  margin-bottom: 1em;
}
.prose-content ul,
.prose-content ol {
  margin-bottom: 1em;
  padding-left: 1.25em;
}
```

- [ ] **Step 4: Build the Nav component**

Create `components/Nav.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  return (
    <header className="border-b border-al-divider">
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Asset Log" width={32} height={32} className="rounded" />
          <span className="font-serif text-sm tracking-wide text-al-silver">ASSET LOG</span>
        </Link>
        <nav className="flex gap-5 font-sans text-xs text-al-label">
          <Link href="/">Home</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Build the Footer component**

Create `components/Footer.tsx`:

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-al-divider bg-al-navy-dark">
      <div className="max-w-2xl mx-auto px-6 py-5 font-sans text-[11px] text-al-muted">
        본 글은 투자 권유가 아닌 개인 학습 목적의 분석입니다.
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Wire up the root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Asset Log",
  description: "대체투자(RWA·STO·PE 등)를 기록하는 개인 투자 아카이브",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-al-navy text-al-silver min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-9">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds (the default `app/page.tsx` still exists and will render inside the new layout, even though it doesn't use the design system yet — Task 5 replaces it).

- [ ] **Step 8: Commit**

```bash
git add app/layout.tsx app/globals.css tailwind.config.ts components/Nav.tsx components/Footer.tsx public/logo.jpg app/icon.jpg
git commit -m "feat: add design tokens, Nav, Footer, and logo assets"
```

---

### Task 5: Home Page

**Files:**
- Create: `components/PostCard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getAllPostsMeta()` and `PostMeta` from `lib/posts.ts` (Task 2); `Nav`/`Footer` layout from Task 4.
- Produces: `<PostCard post={PostMeta} />` component reused by Tasks 7 (category pages).

- [ ] **Step 1: Build the PostCard component**

Create `components/PostCard.tsx`:

```tsx
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="pb-6 mb-6 border-b border-al-divider last:border-0 last:mb-0 last:pb-0">
      <div className="flex gap-2 mb-2.5 font-sans text-[10px]">
        <Link
          href={`/categories/${encodeURIComponent(post.category)}`}
          className="text-al-sage tracking-wide"
        >
          {post.category}
        </Link>
        <span className="text-al-muted">·</span>
        <span className="text-al-muted">{post.date}</span>
      </div>
      <Link href={`/posts/${post.slug}`}>
        <h2 className="font-serif text-xl leading-snug text-al-silver mb-2">{post.title}</h2>
      </Link>
      <p className="font-sans text-sm text-al-muted leading-relaxed">{post.excerpt}</p>
    </article>
  );
}
```

- [ ] **Step 2: Replace the Home page**

Replace `app/page.tsx`:

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

- [ ] **Step 3: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Manual check**

```bash
npm run dev
```

Open `http://localhost:3000` — expect to see the nav bar with logo, then the "PE 비즈니스 모델..." post card with the `대체투자` category tag and excerpt. Stop the dev server (Ctrl+C) when done.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/PostCard.tsx
git commit -m "feat: build home page with post list"
```

---

### Task 6: Post Detail Page

**Files:**
- Create: `app/posts/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getAllPostsMeta()` and `getPostContent()` from `lib/posts.ts` (Task 2).

- [ ] **Step 1: Build the post detail page**

Create `app/posts/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostContent } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPostsMeta().map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostContent(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <div className="flex gap-2 mb-3 font-sans text-[10px] text-al-sage tracking-wide">
        <span>{post.meta.category}</span>
        <span className="text-al-muted">·</span>
        <span className="text-al-muted">{post.meta.date}</span>
      </div>
      <h1 className="font-serif text-2xl leading-snug text-al-silver mb-6">
        {post.meta.title}
      </h1>
      <div
        className="prose-content font-sans text-sm text-al-silver leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
```

(If the scaffolded Next.js version uses synchronous `params` instead of `Promise<params>`, drop the `await` and type `params` as the plain object — check the type error message from `npm run build` if this happens.)

- [ ] **Step 2: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds and generates `/posts/pe-alpha-2026-07-25` as a static route (visible in the build output route list).

- [ ] **Step 3: Manual check**

```bash
npm run dev
```

Open `http://localhost:3000/posts/pe-alpha-2026-07-25` — expect the full article body rendered, ending in the disclaimer sentence. Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add app/posts
git commit -m "feat: build post detail page"
```

---

### Task 7: Categories Pages

**Files:**
- Create: `app/categories/page.tsx`
- Create: `app/categories/[category]/page.tsx`

**Interfaces:**
- Consumes: `getAllCategories()`, `getPostsByCategory()` from `lib/posts.ts` (Task 2); `PostCard` from Task 5.

- [ ] **Step 1: Build the categories index page**

Create `app/categories/page.tsx`:

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

- [ ] **Step 2: Build the category detail page**

Create `app/categories/[category]/page.tsx`:

```tsx
import { getAllCategories, getPostsByCategory } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  const posts = getPostsByCategory(decoded);

  return (
    <div>
      <h1 className="font-serif text-xl text-al-silver mb-6">{decoded}</h1>
      {posts.length === 0 ? (
        <p className="font-sans text-sm text-al-muted">아직 없음</p>
      ) : (
        posts.map((post) => <PostCard key={post.slug} post={post} />)
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds; route list includes `/categories` and `/categories/[category]` with `대체투자` as a generated static param.

- [ ] **Step 4: Manual check**

```bash
npm run dev
```

Open `http://localhost:3000/categories` — expect to see `대체투자` listed. Click it, or open `http://localhost:3000/categories/대체투자` directly — expect the PE post card. Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add app/categories
git commit -m "feat: build categories index and category detail pages"
```

---

### Task 8: About Page

**Files:**
- Create: `lib/about.ts`
- Create: `app/about/page.tsx`

**Interfaces:**
- Consumes: `content/about.md` from Task 3.
- Produces: `getAboutContent(): Promise<string>` (not consumed elsewhere — self-contained).

- [ ] **Step 1: Build the about content loader**

Create `lib/about.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import html from "remark-html";

const ABOUT_PATH = path.join(process.cwd(), "content", "about.md");

export async function getAboutContent(): Promise<string> {
  const raw = fs.readFileSync(ABOUT_PATH, "utf-8");
  const processed = await remark().use(html).process(raw);
  return processed.toString();
}
```

- [ ] **Step 2: Build the About page**

Create `app/about/page.tsx`:

```tsx
import { getAboutContent } from "@/lib/about";

export default async function AboutPage() {
  const contentHtml = await getAboutContent();

  return (
    <div
      className="prose-content font-sans text-sm text-al-silver leading-relaxed"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
```

- [ ] **Step 3: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds; `/about` appears in the route list.

- [ ] **Step 4: Manual check**

```bash
npm run dev
```

Open `http://localhost:3000/about` — expect the "이 사이트는 Asset Log라는 이름으로..." text. Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add lib/about.ts app/about
git commit -m "feat: build about page"
```

---

### Task 9: Deploy to GitHub + Vercel

**Files:**
- None (repository/deployment configuration only).

**Interfaces:**
- Consumes: the fully built site from Tasks 1–8.

- [ ] **Step 1: Create the GitHub repository (public) and push**

```bash
source ~/.zprofile 2>/dev/null
gh repo create asset-log --public --source=. --remote=origin --push
```

(If a repo name other than `asset-log` is wanted, substitute it here — this is the only place the name is used.)

- [ ] **Step 2: Verify the push**

```bash
git log origin/main --oneline -5
```

Expected: shows the same commits as local `main`.

- [ ] **Step 3: Link and deploy to Vercel**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
vercel link --yes
vercel --prod
```

This prints a production URL when done.

- [ ] **Step 4: Verify the deployment**

```bash
curl -s -o /dev/null -w "%{http_code}\n" <production-url-from-step-3>
```

Expected: `200`.

Then open the production URL in a browser and confirm: Home shows the PE post, `/posts/pe-alpha-2026-07-25` renders the full article, `/categories` and `/categories/대체투자` work, `/about` renders, nav logo and favicon show correctly, colors match the approved mockup (dark navy background, silver serif headlines, sage category tags).

- [ ] **Step 5: No commit needed for this task** (deployment step only — Vercel project linkage lives in Vercel's dashboard, not in a tracked file, unless `vercel link` writes a `.vercel/` folder, which is already excluded via `.gitignore`).

---

## Self-Review Notes

- **Spec coverage:** architecture (Task 1–2), content schema/validation (Task 2), all four page types (Tasks 5–8), visual design system incl. logo (Task 4), migration of one flagship post (Task 3), repo/deploy (Task 9) — all spec sections have a corresponding task.
- **Deferred by spec, not included here:** connecting `blog-write` to write directly into `content/posts/`; custom domain; migrating additional Naver blog posts beyond the one seeded post (spec says "범위는 착수 시 결정" — left for a follow-up plan once the owner picks which posts).
- **Type consistency checked:** `PostMeta`, `getAllPostsMeta`, `getAllCategories`, `getPostsByCategory`, `getPostContent` are used with identical names/signatures across Tasks 2, 5, 6, 7.
