import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect('/admin/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-al-divider pb-3">
        <span className="text-xs text-al-label">{session.user?.email}</span>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/admin/login' });
          }}
        >
          <button type="submit" className="text-xs text-al-label hover:text-al-silver">
            로그아웃
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
