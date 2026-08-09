import matter from 'gray-matter';

export interface PostFrontmatter {
  title: string;
  date: string;
  category: string;
  tags: string[];
}

const SOURCE_LOG_PATTERN =
  /\n*---\n*<details>\s*<summary>[^<]*<\/summary>\s*\n*([\s\S]*?)\n*<\/details>\s*$/;

/**
 * Pulls the trailing "출처 확인 로그" <details> block (if present) out of a post
 * body so the admin editor can show it as a separate plain-text field instead
 * of an opaque raw-HTML block inside the WYSIWYG body.
 */
export function splitSourceLog(body: string): { body: string; sourceLog: string | null } {
  const match = body.match(SOURCE_LOG_PATTERN);
  if (!match) {
    return { body: body.trimEnd(), sourceLog: null };
  }
  const sourceLog = match[1].trim();
  const remaining = body.slice(0, match.index).trimEnd();
  return { body: remaining, sourceLog };
}

/**
 * Reassembles frontmatter + body + (optional) source log block into the
 * final markdown file content, mirroring the format blog-write already
 * produces for content/posts/*.md.
 */
export function buildPostMarkdown(
  frontmatter: PostFrontmatter,
  bodyMarkdown: string,
  sourceLog?: string | null
): string {
  let body = `${bodyMarkdown.trimEnd()}\n`;
  if (sourceLog && sourceLog.trim()) {
    body += [
      '',
      '---',
      '',
      '<details>',
      '<summary>출처 확인 로그 보기 — 본문의 모든 사실·수치를 어떻게 재검증했는지</summary>',
      '',
      sourceLog.trim(),
      '',
      '</details>',
      '',
    ].join('\n');
  }
  return matter.stringify(body, {
    title: frontmatter.title,
    date: frontmatter.date,
    category: frontmatter.category,
    tags: frontmatter.tags,
  });
}
