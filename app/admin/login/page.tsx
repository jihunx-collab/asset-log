import { signIn } from '@/auth';

export default function AdminLoginPage() {
  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="font-serif text-lg text-al-silver">Asset Log 관리자</h1>
      <p className="text-xs text-al-label">허용된 Google 계정으로만 로그인할 수 있습니다.</p>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/admin' });
        }}
      >
        <button
          type="submit"
          className="px-4 py-2 rounded bg-al-sage text-al-navy-dark text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Google로 로그인
        </button>
      </form>
    </div>
  );
}
