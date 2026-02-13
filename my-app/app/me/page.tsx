// app/me/page.tsx - DEBUG VERSION
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from './signoutbutton'
import SignInButton from "@/app/auth/signinbutton";

export default async function MePage() {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/auth')
    }

    // Check if profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    console.log('=== DEBUG INFO ===')
    console.log('Google OAuth user.id:', user.id)
    console.log('Google OAuth user.email:', user.email)
    console.log('Profile exists:', !!profile)
    console.log('Profile data:', profile)

    // Find all profiles with this email
    const { data: profilesByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)

    console.log('Profiles with this email:', profilesByEmail)

    // Check caption_likes for this user's ID
    const { data: likesByUserId } = await supabase
        .from('caption_likes')
        .select('*')
        .eq('profile_id', user.id)

    console.log('Likes for current user.id:', likesByUserId?.length)

    // Check if there are likes for OTHER profile IDs with same email
    if (profilesByEmail && profilesByEmail.length > 0) {
        const allProfileIds = profilesByEmail.map(p => p.id)
        const { data: allLikes } = await supabase
            .from('caption_likes')
            .select('*')
            .in('profile_id', allProfileIds)

        console.log('Total likes across all profiles with this email:', allLikes?.length)
    }

    // Fetch user's liked captions
    const { data: likedCaptions } = await supabase
        .from('caption_likes')
        .select(`
      id,
      created_datetime_utc,
      caption_id,
      captions (
        id,
        content,
        like_count,
        image_id,
        images (
          id,
          url
        )
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })

    // Fetch user's voted captions
    const { data: votedCaptions } = await supabase
        .from('caption_votes')
        .select(`
      id,
      vote_value,
      created_datetime_utc,
      caption_id,
      captions (
        id,
        content,
        like_count,
        image_id,
        images (
          id,
          url
        )
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })

    return (
        <div>
            <br></br>
            <div className="text-center">cho cho on my way...!</div>
            <div className="flex justify-center">
                <SignOutButton />
            </div>
        </div>
    )
}