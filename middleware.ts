import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === Admin authentication handling ===
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/forgot-password') return NextResponse.next();

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (pathname === '/admin/login') {
      if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!token?.role || token.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // === Pretty URL redirect for public profile pages ===
  if (pathname.match(/^\/[^@]/) && !pathname.startsWith('/api')) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];
    const systemPaths = [
      'api', 'login', 'signup', 'admin', 'dashboard', '_next',
      'blog', 'videos', 'webinars', 'podcasts', 'testimonials', 'demos',
      'ebook', 'event', 'case-studies', 'white-papers', 'infographics',
    ];
    if (!systemPaths.includes(firstSegment)) {
      return NextResponse.redirect(new URL(`/@${firstSegment}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
