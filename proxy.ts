import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  if (!req.auth && !isLoginPage) {
    const loginUrl = new URL('/admin/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
