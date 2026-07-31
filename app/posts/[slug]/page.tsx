import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostContent } from "@/lib/posts";
import PostCard from "@/components/PostCard";

const OTHER_POSTS_LIMIT = 5;

export function generateStaticParams() {
  return getAllPostsMeta().map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostContent(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllPostsMeta();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const olderPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const otherPosts = allPosts.filter((p) => p.slug !== slug).slice(0, OTHER_POSTS_LIMIT);

  return (
    <article>
      <Link href="/" className="inline-block mb-6 font-sans text-xs text-al-label">
        ← Home
      </Link>
      <div className="flex gap-2 mb-3 font-sans text-[10px] text-al-sage tracking-wide">
        <span>{post.meta.category}</span>
        <span className="text-al-muted">·</span>
        <span className="text-al-muted">{post.meta.date}</span>
      </div>
      <h1 className="font-serif text-2xl leading-snug text-al-silver mb-6">
        {post.meta.title}
      </h1>
      <div
        className="prose-content font-sans text-sm text-al-silver leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {(olderPost || newerPost) && (
        <div className="flex justify-between gap-4 mt-10 pt-6 border-t border-al-divider font-sans text-xs">
          {olderPost ? (
            <Link href={`/posts/${olderPost.slug}`} className="text-al-label">
              ← 이전 글: {olderPost.title}
            </Link>
          ) : (
            <span />
          )}
          {newerPost ? (
            <Link href={`/posts/${newerPost.slug}`} className="text-al-label text-right">
              다음 글: {newerPost.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}

      {otherPosts.length > 0 && (
        <div className="mt-10 pt-6 border-t border-al-divider">
          <h2 className="font-serif text-lg text-al-silver mb-6">다른 글</h2>
          {otherPosts.map((otherPost) => (
            <PostCard key={otherPost.slug} post={otherPost} />
          ))}
        </div>
      )}
    </article>
  );
}
