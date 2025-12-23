import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  const isAdminPath = pathname.startsWith('/admin')
  const isLoginPath = pathname === '/admin/login'
  const hasSession = req.cookies.get('admin_session')?.value === 'true'

  // Only guard /admin paths
  if (!isAdminPath) {
    return NextResponse.next()
  }

  // Allow /admin/login when not logged in; if logged, send to dashboard
  if (isLoginPath) {
    if (hasSession) {
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // For other /admin pages, require session
  if (!hasSession) {
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
