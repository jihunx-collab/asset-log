import { getAllPostsMeta } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 10;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const posts = getAllPostsMeta();

  if (posts.length === 0) {
    return <p className="font-sans text-sm text-al-muted">아직 글이 없습니다.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagePosts = posts.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <p className="font-sans text-xs text-al-label mb-6">총 {posts.length}편</p>
      {pagePosts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
