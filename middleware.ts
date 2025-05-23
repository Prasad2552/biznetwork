//middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const path = pathname;

    // Only run middleware for admin routes and specific non-admin paths
    if (path.startsWith('/admin')) {
        // Allow access to forgot password page
        if (path === '/admin/forgot-password') {
            return NextResponse.next();
        }

        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // Allow access to login page
        if (path === '/admin/login') {
            // If already logged in as admin, redirect to dashboard
            if (token?.role === 'admin') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        // For all other admin routes, check if user is admin
        if (!token?.role || token.role !== 'admin') {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', path);
            return NextResponse.redirect(loginUrl);
        }
    } else if (pathname.match(/^\/[^@]/) && !path.startsWith('/api')) {
        const segments = pathname.split("/")
        const firstSegment = segments[1]

        // Only redirect if it's not a system path
        const systemPaths = ["api", "login", "signup", "admin", "dashboard", "_next", "blog", "videos", "webinars", "podcasts", "testimonials", "demos", "ebook", "event", "case-studies", "white-papers", "infographics"]
        if (!systemPaths.includes(firstSegment)) {
            return NextResponse.redirect(new URL(`/@${firstSegment}`, request.url));
        }
    }

    return NextResponse.next();
}

// Specify paths for middleware to run on
export const config = {
    matcher: [
        '/admin/:path*',
      /*  '/((?!api|_next/static|_next/image|favicon.ico).*)',*/ // Apply to all paths EXCEPT these
    ],
};
