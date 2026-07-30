import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="pb-6 mb-6 border-b border-al-divider last:border-0 last:mb-0 last:pb-0">
      <div className="flex gap-2 mb-2.5 font-sans text-[10px]">
        <Link
          href={`/categories/${encodeURIComponent(post.category)}`}
          className="text-al-sage tracking-wide"
        >
          {post.category}
        </Link>
        <span className="text-al-muted">·</span>
        <span className="text-al-muted">{post.date}</span>
      </div>
      <Link href={`/posts/${post.slug}`}>
        <h2 className="font-serif text-xl leading-snug text-al-silver mb-2">{post.title}</h2>
      </Link>
      <p className="font-sans text-sm text-al-muted leading-relaxed">{post.excerpt}</p>
    </article>
  );
}
