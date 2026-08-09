import Link from "next/link";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-4 mt-10 pt-6 border-t border-al-divider font-sans text-xs">
      {pages.map((page) => (
        <Link
          key={page}
          href={page === 1 ? "/" : `/?page=${page}`}
          className={
            page === currentPage
              ? "text-al-sage font-semibold"
              : "text-al-label hover:text-al-silver"
          }
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
