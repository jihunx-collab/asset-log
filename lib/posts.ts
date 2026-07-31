import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
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
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
    category: data.category,
    tags: data.tags ?? [],
    excerpt: makeExcerpt(content),
    body: content,
  };
}

export function getAllPostsMeta(postsDir: string = DEFAULT_POSTS_DIR): PostMeta[] {
  if (!fs.existsSync(postsDir)) {
    return [];
  }
  const filenames = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  const posts = filenames.map((filename) => {
    const { body: _body, ...meta } = parsePostFile(postsDir, filename);
    return meta;
  });
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  const processed = await remark().use(remarkGfm).use(html).process(body);
  return { meta, contentHtml: processed.toString() };
}
