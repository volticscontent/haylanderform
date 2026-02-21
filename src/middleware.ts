import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminSession } from './lib/admin-auth'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
        const sessionCookie = request.cookies.get('admin_session')?.value;
        const isValid = await verifyAdminSession(sessionCookie);

        if (!isValid) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    if (path === '/admin/login') {
        const sessionCookie = request.cookies.get('admin_session')?.value;
        const isValid = await verifyAdminSession(sessionCookie);
        if (isValid) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
}
