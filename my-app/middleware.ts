import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user } = await updateSession(request)

    // If trying to access /me without being authenticated
    if (request.nextUrl.pathname.startsWith('/me') && !user) {
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    // If authenticated and trying to access /auth (but not the callback), redirect to /me
    if (request.nextUrl.pathname === '/auth' && user) {
        return NextResponse.redirect(new URL('/me', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}