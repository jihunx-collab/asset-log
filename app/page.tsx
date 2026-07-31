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
