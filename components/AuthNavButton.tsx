'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function AuthNavButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span className="opacity-0">로그인</span>;
  }

  if (session) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-al-label hover:text-al-silver"
      >
        로그아웃
      </button>
    );
  }

  return (
    <Link href="/admin/login" className="text-al-label hover:text-al-silver">
      로그인
    </Link>
  );
}
