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

  it('normalizes frontmatter dates to YYYY-MM-DD strings', () => {
    const posts = getAllPostsMeta(fixturesDir);
    const postA = posts.find((p) => p.slug === 'post-a');
    expect(postA?.date).toBe('2026-01-01');
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

describe('posts library — missing posts directory', () => {
  it('returns an empty list instead of throwing when the directory does not exist', () => {
    const missingDir = path.join(os.tmpdir(), 'posts-does-not-exist-' + Date.now());
    expect(() => getAllPostsMeta(missingDir)).not.toThrow();
    expect(getAllPostsMeta(missingDir)).toEqual([]);
  });
});
