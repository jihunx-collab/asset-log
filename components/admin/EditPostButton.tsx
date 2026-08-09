'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function EditPostButton({ slug }: { slug: string }) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <Link
      href={`/admin/posts/${slug}/edit`}
      className="inline-block font-sans text-xs text-al-sage border border-al-divider rounded px-2 py-1 hover:border-al-sage transition-colors"
    >
      이 글 수정
    </Link>
  );
}
