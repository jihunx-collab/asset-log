import Link from "next/link";
import { getAllCategories, getPostsByCategory } from "@/lib/posts";

export default function CategoriesIndexPage() {
  const categories = getAllCategories();

  return (
    <div>
      <h1 className="font-serif text-xl text-al-silver mb-6">Categories</h1>
      {categories.length === 0 ? (
        <p className="font-sans text-sm text-al-muted">아직 없음</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`/categories/${encodeURIComponent(category)}`}
                className="font-sans text-sm text-al-sage"
              >
                {category}
                <span className="text-al-muted"> ({getPostsByCategory(category).length})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
