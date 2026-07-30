import { getAboutContent } from "@/lib/about";

export default async function AboutPage() {
  const contentHtml = await getAboutContent();

  return (
    <div
      className="prose-content font-sans text-sm text-al-silver leading-relaxed"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
