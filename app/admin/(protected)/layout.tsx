import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
