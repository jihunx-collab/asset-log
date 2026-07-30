import { notFound } from "next/navigation";
import { getAllCategories, getPostsByCategory } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!getAllCategories().includes(category)) {
    notFound();
  }

  const posts = getPostsByCategory(category);

  return (
    <div>
      <h1 className="font-serif text-xl text-al-silver mb-6">{category}</h1>
      {posts.length === 0 ? (
        <p className="font-sans text-sm text-al-muted">아직 없음</p>
      ) : (
        posts.map((post) => <PostCard key={post.slug} post={post} />)
      )}
    </div>
  );
}
