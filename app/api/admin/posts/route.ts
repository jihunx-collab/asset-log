import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFile, putFile, deleteFile } from '@/lib/github';
import { buildPostMarkdown, PostFrontmatter } from '@/lib/postFile';
import { slugify } from '@/lib/slugify';

const CATEGORIES = ['기업분석', '대체투자', '부동산', '산업분석', '크립토'];

interface SavePostRequest {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  bodyMarkdown: string;
  sourceLog?: string | null;
  status: 'draft' | 'published';
  previousStatus?: 'draft' | 'published' | null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
  }

  const payload = (await req.json()) as SavePostRequest;

  const slug = slugify(payload.slug ?? '');
  if (!slug) {
    return NextResponse.json({ error: '영문 슬러그를 입력해주세요.' }, { status: 400 });
  }
  if (!payload.title?.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }
  if (!CATEGORIES.includes(payload.category)) {
    return NextResponse.json({ error: '카테고리가 올바르지 않습니다.' }, { status: 400 });
  }

  const frontmatter: PostFrontmatter = {
    title: payload.title.trim(),
    date: payload.date,
    category: payload.category,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
  };
  const markdown = buildPostMarkdown(frontmatter, payload.bodyMarkdown ?? '', payload.sourceLog);

  const draftPath = `content/drafts/${slug}.md`;
  const postPath = `content/posts/${slug}.md`;
  const targetPath = payload.status === 'published' ? postPath : draftPath;

  const commitMessage =
    payload.status === 'published'
      ? `content: publish ${frontmatter.title} via admin UI`
      : `content: save draft ${frontmatter.title} via admin UI`;

  await putFile(targetPath, markdown, commitMessage);

  // 발행 시, 같은 슬러그의 임시저장 파일이 있었다면 제거해 중복을 남기지 않는다.
  if (payload.status === 'published' && payload.previousStatus === 'draft') {
    await deleteFile(draftPath, `content: remove draft after publishing ${frontmatter.title}`);
  }

  return NextResponse.json({ ok: true, slug, status: payload.status });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 });
  }

  const draft = await getFile(`content/drafts/${slug}.md`);
  if (draft) {
    return NextResponse.json({ raw: draft.content, status: 'draft' });
  }
  const published = await getFile(`content/posts/${slug}.md`);
  if (published) {
    return NextResponse.json({ raw: published.content, status: 'published' });
  }
  return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
}
