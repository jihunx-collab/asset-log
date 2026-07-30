import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostContent } from "@/lib/posts";

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

  return (
    <article>
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
    </article>
  );
}
