import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken = request.cookies.get('auth_token')?.value

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth/callback', // The auth callback is a public route
    '/api',
    '/_next',
    '/favicon.ico',
    '/virion-labs-logo-black.png' // Assume logo is public
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (!authToken && !isPublicRoute) {
    // User is not authenticated and is trying to access a protected route,
    // redirect them to the login page.
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname) // Optionally pass the intended destination
    return NextResponse.redirect(loginUrl)
  }

  if (authToken && (pathname === '/login' || pathname === '/signup')) {
    // If the user is authenticated and tries to access login/signup,
    // redirect them to the home page.
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Add cache control headers to prevent caching of protected pages
  const response = NextResponse.next()
  if (!isPublicRoute) {
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 