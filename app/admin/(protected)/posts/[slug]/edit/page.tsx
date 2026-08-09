import { notFound } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';
import { loadEditablePost } from '@/lib/adminPosts';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = loadEditablePost(slug);
  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-lg text-al-silver">글 수정</h1>
      <PostEditor mode="edit" initial={{ slug, ...data }} />
    </div>
  );
}
