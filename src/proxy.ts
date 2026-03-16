import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminSession } from './lib/dashboard-auth'

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    if (path.startsWith('/dashboard') && !path.startsWith('/login')) {
        const sessionCookie = request.cookies.get('admin_session')?.value;
        const isValid = await verifyAdminSession(sessionCookie);

        if (!isValid) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    if (path === '/login') {
        const sessionCookie = request.cookies.get('admin_session')?.value;
        // Check if already logged in to redirect to dashboard
        if (sessionCookie) {
             const isValid = await verifyAdminSession(sessionCookie);
             if (isValid) {
                 return NextResponse.redirect(new URL('/dashboard', request.url));
             }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
}
