import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
        const supabase = await createClient()

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successfully authenticated - redirect to /me
            return NextResponse.redirect(`${origin}/me`)
        }
    }

    // If there was an error, redirect back to auth page
    return NextResponse.redirect(`${origin}/auth`)
}