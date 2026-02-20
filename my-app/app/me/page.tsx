import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MeInteractiveDisplay from './MeInteractiveDisplay'
import { VotedCaption } from '@/types'

export default async function MePage({
                                         searchParams: searchParamsPromise
                                     }: {
    searchParams: Promise<{ filter?: string }>
}) {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/auth')
    }

    const searchParams = await searchParamsPromise

    // Fetch voted captions with proper typing
    const { data: rawVotedCaptions, error: fetchError } = await supabase
        .from('caption_votes')
        .select(`
      id,
      vote_value,
      created_datetime_utc,
      captions!inner (
        id,
        content,
        like_count,
        images!inner (
          id,
          url
        )
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })
        .returns<VotedCaption[]>()  // Tell Supabase the expected return type

    if (fetchError) {
        console.error('Error fetching voted captions:', fetchError)
        return <p>Error loading voted captions.</p>
    }

    // Now TypeScript knows the correct type
    const typedAllVotedCaptions = rawVotedCaptions || []

    // Calculate stats
    const totalVotes = typedAllVotedCaptions.length
    const upvotes = typedAllVotedCaptions.filter(vote => vote.vote_value > 0).length
    const downvotes = typedAllVotedCaptions.filter(vote => vote.vote_value < 0).length

    const activeFilter: 'upvotes' | 'downvotes' | 'all' =
        (searchParams.filter as 'upvotes' | 'downvotes' | 'all') || 'upvotes'

    // Filter based on active filter
    let filteredCaptionsForDisplay: VotedCaption[] = []
    if (activeFilter === 'upvotes') {
        filteredCaptionsForDisplay = typedAllVotedCaptions.filter(vote => vote.vote_value > 0)
    } else if (activeFilter === 'downvotes') {
        filteredCaptionsForDisplay = typedAllVotedCaptions.filter(vote => vote.vote_value < 0)
    } else {
        filteredCaptionsForDisplay = typedAllVotedCaptions
    }

    return (
        <MeInteractiveDisplay
            user={user}
            initialVotedCaptions={filteredCaptionsForDisplay}
            totalVotes={totalVotes}
            upvotes={upvotes}
            downvotes={downvotes}
            initialActiveFilter={activeFilter}
        />
    )
}