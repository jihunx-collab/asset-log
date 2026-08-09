import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { splitSourceLog, buildPostMarkdown } from './postFile';

describe('splitSourceLog', () => {
  it('separates a trailing 출처 확인 로그 details block from the body', () => {
    const raw = [
      '본문 첫 문단입니다.',
      '',
      '본문 둘째 문단입니다.',
      '',
      '---',
      '',
      '<details>',
      '<summary>출처 확인 로그 보기</summary>',
      '',
      '- 주장: 어쩌구 / 결과: [1차]',
      '',
      '</details>',
    ].join('\n');

    const { body, sourceLog } = splitSourceLog(raw);
    expect(body).toBe('본문 첫 문단입니다.\n\n본문 둘째 문단입니다.');
    expect(sourceLog).toBe('- 주장: 어쩌구 / 결과: [1차]');
  });

  it('returns null sourceLog when there is no trailing details block', () => {
    const raw = '그냥 평범한 본문입니다.';
    const { body, sourceLog } = splitSourceLog(raw);
    expect(body).toBe('그냥 평범한 본문입니다.');
    expect(sourceLog).toBeNull();
  });
});

describe('buildPostMarkdown', () => {
  const frontmatter = {
    title: '테스트 글',
    date: '2026-08-09',
    category: '기업분석',
    tags: ['태그1', '태그2'],
  };

  it('produces parseable frontmatter with the given fields', () => {
    const output = buildPostMarkdown(frontmatter, '본문입니다.', null);
    const { data, content } = matter(output);
    expect(data.title).toBe('테스트 글');
    expect(data.category).toBe('기업분석');
    expect(data.tags).toEqual(['태그1', '태그2']);
    expect(content.trim()).toBe('본문입니다.');
  });

  it('wraps a non-empty source log in a collapsible details block', () => {
    const output = buildPostMarkdown(frontmatter, '본문입니다.', '- 주장: X / 결과: [1차]');
    expect(output).toContain('<details>');
    expect(output).toContain('<summary>출처 확인 로그');
    expect(output).toContain('- 주장: X / 결과: [1차]');
    expect(output).toContain('</details>');
  });

  it('omits the details block when source log is empty or null', () => {
    const output = buildPostMarkdown(frontmatter, '본문입니다.', '');
    expect(output).not.toContain('<details>');
  });

  it('round-trips through splitSourceLog', () => {
    const built = buildPostMarkdown(frontmatter, '본문 내용입니다.', '- 주장: A / 결과: [2차]');
    const { content } = matter(built);
    const { body, sourceLog } = splitSourceLog(content);
    expect(body).toBe('본문 내용입니다.');
    expect(sourceLog).toBe('- 주장: A / 결과: [2차]');
  });
});
