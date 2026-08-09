import Link from 'next/link';
import { getAllPostsMeta, getAllDraftsMeta } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default function AdminHomePage() {
  const posts = getAllPostsMeta();
  const drafts = getAllDraftsMeta();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-lg text-al-silver">글 관리</h1>
        <Link
          href="/admin/posts/new"
          className="px-3 py-1.5 rounded bg-al-sage text-al-on-accent text-xs font-medium hover:opacity-90 transition-opacity"
        >
          새 글 작성
        </Link>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs text-al-label uppercase tracking-wide">임시저장 ({drafts.length})</h2>
        {drafts.length === 0 && <p className="text-xs text-al-muted">임시저장된 글이 없습니다.</p>}
        <ul className="flex flex-col gap-1">
          {drafts.map((d) => (
            <li key={d.slug} className="flex items-center justify-between border-b border-al-divider py-2 text-sm">
              <Link href={`/admin/posts/${d.slug}/edit`} className="text-al-silver hover:text-al-sage">
                {d.title}
              </Link>
              <span className="text-xs text-al-muted">{d.date}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs text-al-label uppercase tracking-wide">발행된 글 ({posts.length})</h2>
        <ul className="flex flex-col gap-1">
          {posts.map((p) => (
            <li key={p.slug} className="flex items-center justify-between border-b border-al-divider py-2 text-sm">
              <Link href={`/admin/posts/${p.slug}/edit`} className="text-al-silver hover:text-al-sage">
                {p.title}
              </Link>
              <span className="text-xs text-al-muted">
                {p.category} · {p.date}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
