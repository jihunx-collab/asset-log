import PostEditor from '@/components/admin/PostEditor';

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-lg text-al-silver">새 글 작성</h1>
      <PostEditor mode="new" />
    </div>
  );
}
